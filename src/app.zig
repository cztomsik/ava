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
};

/// Shared application state.
pub const App = struct {
    allocator: std.mem.Allocator,
    home: []const u8,
    log_file: std.fs.File,
    config: std.json.Parsed(Config),
    db: fr.Pool,
    llama: llama.Pool,
    client: std.http.Client,
    server: *tk.Server,

    pub fn init(allocator: std.mem.Allocator) !*App {
        const self = try allocator.create(App);
        self.allocator = allocator;
        errdefer allocator.destroy(self);

        self.home = try std.fs.getAppDataDir(allocator, "AvaPLS");
        errdefer allocator.free(self.home);

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

    pub fn getHomePath(self: *App, allocator: std.mem.Allocator, paths: []const []const u8) ![:0]const u8 {
        const arr = try allocator.alloc([]const u8, paths.len + 1);
        defer allocator.free(arr);

        arr[0] = self.home;
        for (paths, 1..) |p, i| arr[i] = p;

        return std.fs.path.joinZ(allocator, arr);
    }

    pub fn getWritableHomePath(self: *App, allocator: std.mem.Allocator, paths: []const []const u8) ![:0]const u8 {
        const res = try self.getHomePath(allocator, paths);
        std.fs.makeDirAbsolute(std.fs.path.dirname(res).?) catch {};

        return res;
    }

    pub fn openFile(self: *App, paths: []const []const u8, flags: enum { r, w }) !std.fs.File {
        const path = switch (flags) {
            .r => try self.getHomePath(self.allocator, paths),
            .w => try self.getWritableHomePath(self.allocator, paths),
        };
        defer self.allocator.free(path);

        return switch (flags) {
            .r => std.fs.openFileAbsolute(path, .{ .mode = .read_only }),
            .w => std.fs.createFileAbsolute(path, .{}),
        };
    }

    fn initLog(self: *App) !void {
        self.log_file = try self.openFile(&.{"log.txt"}, .w);
    }

    fn initConfig(self: *App) !void {
        const file = self.openFile(&.{"config.json"}, .r) catch |e| switch (e) {
            error.FileNotFound => {
                self.config = try std.json.parseFromSlice(Config, self.allocator, "{}", .{});
                return;
            },
            else => return e,
        };
        defer file.close();

        var reader = std.json.reader(self.allocator, file.reader());
        defer reader.deinit();

        self.config = try std.json.parseFromTokenSource(Config, self.allocator, &reader, .{});
    }

    fn initDb(self: *App) !void {
        const db_file = try self.getWritableHomePath(self.allocator, &.{"db"});
        defer self.allocator.free(db_file);

        try fr.migrate(self.allocator, db_file, @embedFile("db_schema.sql"));

        self.db = try fr.Pool.init(self.allocator, db_file, .{ .count = 2 });
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
        self.server = try tk.Server.start(self.allocator, handler, .{
            .injector = try tk.Injector.from(.{ self, &self.db, &self.llama, &self.client }),
            .port = self.config.value.server.port,
            .keep_alive = self.config.value.server.keep_alive,
        });
    }

    pub fn log(self: *App, comptime level: std.log.Level, comptime scope: @Type(.EnumLiteral), comptime fmt: []const u8, args: anytype) void {
        if (comptime builtin.mode == .Debug) std.log.defaultLog(level, scope, fmt, args);

        std.debug.getStderrMutex().lock();
        defer std.debug.getStderrMutex().unlock();

        const t = @mod(@as(u64, @intCast(std.time.timestamp())), 86_400);
        const s = @mod(t, 60);
        const m = @divTrunc(@mod(t, 3_600), 60);
        const h = @divTrunc(t, 3_600);

        const writer = self.log_file.writer();
        writer.print("{:0>2}:{:0>2}:{:0>2} " ++ level.asText() ++ " " ++ @tagName(scope) ++ ": " ++ fmt ++ "\n", .{ h, m, s } ++ args) catch return;
    }

    pub fn dumpLog(self: *App, allocator: std.mem.Allocator) ![]const u8 {
        var f = try self.openFile(&.{"log.txt"}, .r);
        defer f.close();

        return f.readToEndAlloc(allocator, std.math.maxInt(usize));
    }

    pub fn deinit(self: *App) void {
        self.server.deinit();
        self.client.deinit();
        self.llama.deinit();
        self.db.deinit();
        self.config.deinit();
        self.log_file.close();
        self.allocator.free(self.home);
        self.allocator.destroy(self);
    }
};

const handler = tk.chain(.{
    tk.logger(.{}),
    tk.provide(fr.Session.fromPool),

    // Handle API requests
    tk.group("/api", tk.chain(.{
        tk.router(@import("api.zig")),
        tk.send(error.NotFound),
    })),

    // Serve static files
    tk.get("/LICENSE.md", tk.sendStatic("LICENSE.md")),
    tk.get("/favicon.ico", tk.sendStatic("src/app/favicon.ico")),
    tk.get("/app.js", tk.sendStatic("zig-out/app/main.js")),

    // Disable source maps in production
    tk.get("*.map", tk.send(@as([]const u8, "{}"))),

    // HTML5 fallback
    tk.sendStatic("src/app/index.html"),
});
