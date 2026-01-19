const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const llama = @import("llama.zig");

/// Application configuration.
pub const Config = struct {
    db: fr.SQLite3.Options = .{
        .dir = null, // defaults to Home.path
        .filename = "db",
    },
    db_pool: fr.PoolOptions = .{},
    llama: llama.PoolOptions = .{},
    server: tk.ListenOptions = .{
        .port = 3002,
    },
    download: struct {
        path: []const u8 = "models",
    } = .{},
};

pub const Home = struct {
    dir: std.fs.Dir,
    path: []const u8,

    const HOME_ENV = "AVA_HOME";
    const HOME_DEF = "AvaPLS";

    pub fn init(allocator: std.mem.Allocator) !Home {
        const path = std.process.getEnvVarOwned(allocator, HOME_ENV) catch try std.fs.getAppDataDir(allocator, HOME_DEF);
        errdefer allocator.free(path);

        return .{
            .path = path,
            .dir = try std.fs.cwd().makeOpenPath(path, .{}),
        };
    }

    pub fn deinit(self: *Home, allocator: std.mem.Allocator) void {
        self.dir.close();
        allocator.free(self.path);
    }

    pub fn openFile(self: Home, path: []const u8, flags: enum { r, w }) !std.fs.File {
        if (flags == .w) {
            if (std.fs.path.dirname(path)) |d| {
                self.dir.makePath(d) catch |e| switch (e) {
                    error.PathAlreadyExists => {},
                    else => return e,
                };
            }
        }

        return switch (flags) {
            .r => self.dir.openFile(path, .{ .mode = .read_only }),
            .w => self.dir.createFile(path, .{}),
        };
    }
};

pub const Logger = struct {
    home: *Home,
    file: std.fs.File,

    const LOG_FILE = "log.txt";

    pub var inst: ?*Logger = null;

    pub fn init(target: *Logger, home: *Home) !void {
        target.* = .{
            .home = home,
            .file = try home.openFile(LOG_FILE, .w),
        };
        inst = target;
    }

    pub fn deinit(self: *Logger) void {
        inst = null;
        self.file.close();
    }

    pub fn log(self: Logger, comptime level: std.log.Level, comptime scope: @Type(.enum_literal), comptime fmt: []const u8, args: anytype) void {
        if (comptime builtin.mode == .Debug) std.log.defaultLog(level, scope, fmt, args);

        std.debug.lockStdErr();
        defer std.debug.unlockStdErr();

        const t = @mod(@as(u64, @intCast(std.time.timestamp())), 86_400);
        const s = @mod(t, 60);
        const m = @divTrunc(@mod(t, 3_600), 60);
        const h = @divTrunc(t, 3_600);

        var fw = self.file.writer(&.{});
        fw.interface.print("{:0>2}:{:0>2}:{:0>2} " ++ level.asText() ++ " " ++ @tagName(scope) ++ ": " ++ fmt ++ "\n", .{ h, m, s } ++ args) catch return;
    }

    pub fn dump(self: Logger, allocator: std.mem.Allocator) ![]const u8 {
        var f = try self.home.openFile(LOG_FILE, .r);
        defer f.close();

        return f.readToEndAlloc(allocator, std.math.maxInt(usize));
    }
};

/// Shared application state.
pub const App = struct {
    mutex: std.Thread.Mutex = .{},
    home: Home,
    logger: Logger,
    config: std.json.Parsed(Config),
    db_pool: fr.Pool(fr.SQLite3),
    llama: llama.Pool, // TODO: extract to standalone module
    client: std.http.Client, // TODO: switch to tk.Client
    server: tk.Server,

    const CONFIG_FILE = "config.json";

    pub fn configure(bundle: *tk.Bundle) void {
        // We can't use `routes: [] = ...` field default because we need to reference api again for swagger
        bundle.provide([]const tk.Route, .value(routes));

        // TODO: Maybe the default for fields should be .anyhow?
        bundle.override(std.json.Parsed(Config), .factory(readConfig));

        // Make all config.xxx fields available for injection
        bundle.expose(std.json.Parsed(Config), "value");
        inline for (std.meta.fields(Config)) |f| bundle.expose(Config, f.name);

        // Auto-create ServerOptions using default values and what we already have available in the config
        bundle.provide(tk.ServerOptions, .auto);

        bundle.addInitHook(setDefaultDbPath);
        bundle.addInitHook(migrateDb);
        bundle.addInitHook(loadCerts);
    }

    fn setDefaultDbPath(db_opts: *fr.SQLite3.Options, home: *Home) !void {
        db_opts.dir = db_opts.dir orelse home.path;
    }

    fn migrateDb(allocator: std.mem.Allocator, db_pool: *fr.Pool(fr.SQLite3)) !void {
        var db = try db_pool.getSession(allocator);
        defer db.deinit();

        try fr.migrate(&db, @embedFile("db_schema.sql"));
    }

    fn loadCerts(allocator: std.mem.Allocator, client: *std.http.Client) !void {
        if (comptime builtin.target.os.tag == .windows) {
            try client.ca_bundle.rescan(allocator);
            const start = client.ca_bundle.bytes.items.len;
            try client.ca_bundle.bytes.appendSlice(allocator, @embedFile("amazon1.cer"));
            try client.ca_bundle.parseCert(allocator, @intCast(start), std.time.timestamp());
        }
    }

    pub fn updateConfig(self: *App, config: Config) !void {
        // thread-safety!
        self.mutex.lock();
        defer self.mutex.unlock();

        try writeConfig(&self.home, config);

        const new = try readConfig(&self.home, self.config.arena.child_allocator);
        errdefer new.deinit();

        self.llama.reset(new.value.llama);

        self.config.deinit();
        self.config = new;
    }

    pub fn readConfig(home: *Home, allocator: std.mem.Allocator) !std.json.Parsed(Config) {
        const file = home.openFile(CONFIG_FILE, .r) catch |e| switch (e) {
            error.FileNotFound => return std.json.parseFromSlice(Config, allocator, "{}", .{}),
            else => return e,
        };
        defer file.close();

        const contents = try file.readToEndAlloc(allocator, 16 * 1024);
        defer allocator.free(contents);

        return try std.json.parseFromSlice(Config, allocator, contents, .{ .allocate = .alloc_always, .ignore_unknown_fields = true });
    }

    pub fn writeConfig(home: *Home, config: Config) !void {
        const file = try home.openFile(CONFIG_FILE, .w);
        defer file.close();

        var fw = file.writer(&.{});
        try std.json.fmt(config, .{}).format(&fw.interface);
    }
};

const api: tk.Route = .group("/api", &.{
    @import("api.zig").root,
    .send(error.NotFound),
});

const routes = &.{
    tk.logger(.{}, &.{
        .provide(fr.Pool(fr.SQLite3).getSession, &.{
            // Handle API requests
            api,
            .get("/openapi.json", tk.swagger.json(.{
                .info = .{ .title = "Ava API" },
                .routes = &.{api},
            })),
            .get("/swagger-ui", tk.swagger.ui(.{ .url = "/openapi.json" })),
            // Serve static files
            .get("/LICENSE.md", tk.static.file("LICENSE.md")),
            .get("/favicon.ico", tk.static.file("src/app/favicon.ico")),
            .get("/index.css", tk.static.file("zig-out/app/index.css")),
            .get("/index.js", tk.static.file("zig-out/app/index.js")),
            // Disable source maps in production
            .get("/*.map", tk.send(@as([]const u8, "{}"))),
            // HTML5 fallback
            tk.static.file("src/app/index.html"),
        }),
    }),
};
