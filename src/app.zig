const std = @import("std");
const sqlite = @import("ava-sqlite");
const tk = @import("tokamak");
const llama = @import("llama.zig");
const util = @import("util.zig");

/// Shared application state.
pub const App = struct {
    gpa: std.heap.GeneralPurposeAllocator(.{}),
    allocator: std.mem.Allocator,
    db: sqlite.SQLite3,
    llama: llama.Pool,
    server: *tk.Server,

    pub fn init(self: *App) !void {
        self.gpa = .{};
        const allocator = self.gpa.allocator();

        const db_file = try util.getWritableHomePath(allocator, &.{"db"});
        defer allocator.free(db_file);

        self.db = try sqlite.SQLite3.open(db_file);
        try sqlite.migrate(allocator, &self.db, @embedFile("db_schema.sql"));

        self.llama = llama.Pool.init(allocator);

        self.server = try tk.Server.start(allocator, handler, .{
            .injector = tk.Injector.from(self),
            .port = 3002,
        });
    }

    pub fn deinit(self: *App) void {
        const thread = self.server.thread;
        self.server.deinit();
        thread.join();

        self.llama.deinit();
        self.db.close();
        _ = self.gpa.deinit();
    }
};

fn handler(injector: tk.Injector, uri: *std.Uri, r: *tk.Responder) anyerror!void {
    // handle API requests
    if (tk.Params.match("/api/*", uri.path)) |_| {
        uri.path = uri.path[4..];
        return r.send(injector.call(tk.router(@import("api.zig")), .{}));
    }

    // TODO: should be .get() but it's not implemented yet
    if (tk.Params.match("/LICENSE.md", uri.path)) |_| return r.sendResource("LICENSE.md");
    if (tk.Params.match("/favicon.ico", uri.path)) |_| return r.sendResource("src/app/favicon.ico");
    if (tk.Params.match("/app.js", uri.path)) |_| return r.sendResource("zig-out/app/main.js");

    // disable source maps in production
    if (tk.Params.match("*.map", uri.path)) |_| return r.sendChunk("{}");

    // HTML5 fallback
    try r.sendResource("src/app/index.html");
}
