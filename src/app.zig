const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const llama = @import("llama.zig");

/// Application configuration.
pub const Config = struct {
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

        const writer = self.file.writer();
        writer.print("{:0>2}:{:0>2}:{:0>2} " ++ level.asText() ++ " " ++ @tagName(scope) ++ ": " ++ fmt ++ "\n", .{ h, m, s } ++ args) catch return;
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
    db_opts: fr.SQLite3.Options = .{ .filename = "" },
    db_pool: fr.Pool,
    llama: llama.Pool,
    client: std.http.Client,
    server: tk.Server,

    const CONFIG_FILE = "config.json";
    const DB_FILE = "db";

    pub fn initDb(home: *Home, allocator: std.mem.Allocator, db_opts: *fr.SQLite3.Options) !fr.Pool {
        // TODO: db_opts needs to stay alive together with db_pool
        const path = try std.fs.path.joinZ(allocator, &.{ home.path, DB_FILE });
        errdefer allocator.free(path);

        try fr.migrate(allocator, path, @embedFile("db_schema.sql"));
        db_opts.filename = path;
        return try fr.Pool.init(fr.SQLite3, allocator, 2, db_opts);
    }

    pub fn initConfig(target: *std.json.Parsed(Config), ct: *tk.Container) !void {
        target.* = try ct.injector.call(readConfig, .{});
        try ct.register(&target.value);
        inline for (std.meta.fields(Config)) |f| try ct.register(&@field(target.value, f.name));
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

        var reader = std.json.reader(allocator, file.reader());
        defer reader.deinit();

        return try std.json.parseFromTokenSource(Config, allocator, &reader, .{ .ignore_unknown_fields = true });
    }

    pub fn writeConfig(home: *Home, config: Config) !void {
        const file = try home.openFile(CONFIG_FILE, .w);
        defer file.close();

        try std.json.stringify(
            config,
            .{ .whitespace = .indent_2 },
            file.writer(),
        );
    }

    pub fn initClient(target: *std.http.Client, allocator: std.mem.Allocator) !void {
        target.* = .{ .allocator = allocator };

        if (builtin.target.os.tag == .windows) {
            try target.ca_bundle.rescan(allocator);
            const start = target.ca_bundle.bytes.items.len;
            try target.ca_bundle.bytes.appendSlice(allocator, @embedFile("amazon1.cer"));
            try target.ca_bundle.parseCert(allocator, @intCast(start), std.time.timestamp());
        }
    }

    pub fn initServer(target: *tk.Server, allocator: std.mem.Allocator, cfg: @FieldType(Config, "server"), injector: tk.Injector) !void {
        target.* = try tk.Server.init(allocator, routes, .{
            .listen = cfg,
            .injector = injector,
        });
    }
};

const api: tk.Route = .group("/api", &.{
    .router(@import("api.zig")),
    .send(error.NotFound),
});

const routes = &.{
    tk.logger(.{}, &.{
        .provide(fr.Pool.getSession, &.{
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
            .get("/app.js", tk.static.file("zig-out/app/main.js")),
            // Disable source maps in production
            .get("/*.map", tk.send(@as([]const u8, "{}"))),
            // HTML5 fallback
            tk.static.file("src/app/index.html"),
        }),
    }),
};
