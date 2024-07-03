const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const llama = @import("llama.zig");

/// Application configuration.
pub const Config = struct {
    llama: llama.PoolOptions = .{},
    server: struct {
        port: u16 = 3002,
        keep_alive: bool = false,
    } = .{},
    download: struct {
        path: []const u8 = "models",
    } = .{},
};

/// Shared application state.
pub const App = struct {
    mutex: std.Thread.Mutex,
    allocator: std.mem.Allocator,
    home_dir: std.fs.Dir,
    log_file: std.fs.File,
    config: std.json.Parsed(Config),
    db: fr.Pool,
    llama: llama.Pool,
    client: std.http.Client,
    server: *tk.Server,

    const HOME_ENV = "AVA_HOME";
    const HOME_DEF = "AvaPLS";
    const LOG_FILE = "log.txt";
    const CONFIG_FILE = "config.json";
    const DB_FILE = "db";

    pub fn init(allocator: std.mem.Allocator) !*App {
        const self = try allocator.create(App);
        self.mutex = .{};
        self.allocator = allocator;
        errdefer allocator.destroy(self);

        try self.initHome();
        errdefer self.home_dir.close();

        try self.initLog();
        errdefer self.log_file.close();

        try self.initConfig();
        errdefer self.config.deinit();

        try self.initDb();
        errdefer self.db.deinit();

        try self.initLlama();
        errdefer self.llama.deinit();

        try self.initClient();
        errdefer self.client.deinit();

        try self.initServer();
        errdefer self.server.deinit();

        return self;
    }

    fn initHome(self: *App) !void {
        const path = std.process.getEnvVarOwned(self.allocator, HOME_ENV) catch try std.fs.getAppDataDir(self.allocator, HOME_DEF);
        defer self.allocator.free(path);

        self.home_dir = try std.fs.cwd().makeOpenPath(path, .{});
    }

    fn initLog(self: *App) !void {
        self.log_file = try self.openFile(LOG_FILE, .w);
    }

    fn initConfig(self: *App) !void {
        self.config = try self.readConfig(self.allocator);
    }

    fn initDb(self: *App) !void {
        const home_path = try self.home_dir.realpathAlloc(self.allocator, ".");
        defer self.allocator.free(home_path);

        const path = try std.fs.path.joinZ(self.allocator, &.{ home_path, DB_FILE });
        defer self.allocator.free(path);

        try fr.migrate(self.allocator, path, @embedFile("db_schema.sql"));

        self.db = try fr.Pool.init(self.allocator, path, .{ .count = 2 });
    }

    fn initLlama(self: *App) !void {
        self.llama = llama.Pool.init(self.allocator, self.config.value.llama);
    }

    fn initClient(self: *App) !void {
        self.client = .{ .allocator = self.allocator };

        if (builtin.target.os.tag == .windows) {
            try self.client.ca_bundle.rescan(self.allocator);
            const start = self.client.ca_bundle.bytes.items.len;
            try self.client.ca_bundle.bytes.appendSlice(self.allocator, @embedFile("windows/amazon1.cer"));
            try self.client.ca_bundle.parseCert(self.allocator, @intCast(start), std.time.timestamp());
        }
    }

    fn initServer(self: *App) !void {
        self.server = try tk.Server.init(self.allocator, routes, .{
            .injector = tk.Injector.init(self, null),
        });
    }

    pub fn openFile(self: *const App, path: []const u8, flags: enum { r, w }) !std.fs.File {
        if (flags == .w) {
            if (std.fs.path.dirname(path)) |d| {
                self.home_dir.makePath(d) catch |e| switch (e) {
                    error.PathAlreadyExists => {},
                    else => return e,
                };
            }
        }

        return switch (flags) {
            .r => self.home_dir.openFile(path, .{ .mode = .read_only }),
            .w => self.home_dir.createFile(path, .{}),
        };
    }

    pub fn log(self: *const App, comptime level: std.log.Level, comptime scope: @Type(.EnumLiteral), comptime fmt: []const u8, args: anytype) void {
        if (comptime builtin.mode == .Debug) std.log.defaultLog(level, scope, fmt, args);

        std.debug.lockStdErr();
        defer std.debug.unlockStdErr();

        const t = @mod(@as(u64, @intCast(std.time.timestamp())), 86_400);
        const s = @mod(t, 60);
        const m = @divTrunc(@mod(t, 3_600), 60);
        const h = @divTrunc(t, 3_600);

        const writer = self.log_file.writer();
        writer.print("{:0>2}:{:0>2}:{:0>2} " ++ level.asText() ++ " " ++ @tagName(scope) ++ ": " ++ fmt ++ "\n", .{ h, m, s } ++ args) catch return;
    }

    pub fn dumpLog(self: *const App, allocator: std.mem.Allocator) ![]const u8 {
        var f = try self.openFile(LOG_FILE, .r);
        defer f.close();

        return f.readToEndAlloc(allocator, std.math.maxInt(usize));
    }

    pub fn updateConfig(self: *App, config: Config) !void {
        // thread-safety!
        self.mutex.lock();
        defer self.mutex.unlock();

        try self.writeConfig(config);

        const new = try self.readConfig(self.allocator);
        errdefer new.deinit();

        self.llama.reset(new.value.llama);

        self.config.deinit();
        self.config = new;
    }

    pub fn readConfig(self: *const App, allocator: std.mem.Allocator) !std.json.Parsed(Config) {
        const file = self.openFile(CONFIG_FILE, .r) catch |e| switch (e) {
            error.FileNotFound => return std.json.parseFromSlice(Config, allocator, "{}", .{}),
            else => return e,
        };
        defer file.close();

        var reader = std.json.reader(allocator, file.reader());
        defer reader.deinit();

        return try std.json.parseFromTokenSource(Config, allocator, &reader, .{});
    }

    pub fn writeConfig(self: *const App, config: Config) !void {
        const file = try self.openFile(CONFIG_FILE, .w);
        defer file.close();

        try std.json.stringify(
            config,
            .{ .whitespace = .indent_2 },
            file.writer(),
        );
    }

    pub fn deinit(self: *App) void {
        self.server.deinit();
        self.client.deinit();
        self.llama.deinit();
        self.db.deinit();
        self.config.deinit();
        self.log_file.close();
        self.home_dir.close();
        self.allocator.destroy(self);
    }
};

const routes = &.{
    tk.logger(.{}, &.{
        tk.provide(fr.Session.fromPool, &.{
            // Handle API requests
            tk.group("/api", &.{
                tk.router(@import("api.zig")),
                .{ .handler = tk.send(error.NotFound) },
            }),
            // Serve static files
            tk.get("/LICENSE.md", tk.sendStatic("LICENSE.md")),
            tk.get("/favicon.ico", tk.sendStatic("src/app/favicon.ico")),
            tk.get("/app.js", tk.sendStatic("zig-out/app/main.js")),
            // Disable source maps in production
            tk.get("/*.map", tk.send(@as([]const u8, "{}"))),
            // HTML5 fallback
            tk.get("/*", tk.sendStatic("src/app/index.html")),
        }),
    }),
};
