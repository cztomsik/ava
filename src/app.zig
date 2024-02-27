const builtin = @import("builtin");
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
    client: std.http.Client,
    server: *tk.Server,

    pub fn init(self: *App) !void {
        self.gpa = .{};
        const allocator = self.gpa.allocator();

        const db_file = try util.getWritableHomePath(allocator, &.{"db"});
        defer allocator.free(db_file);

        self.db = try sqlite.SQLite3.open(db_file);
        try sqlite.migrate(allocator, &self.db, @embedFile("db_schema.sql"));

        self.llama = llama.Pool.init(allocator);

        self.client = .{ .allocator = allocator };

        if (builtin.target.os.tag == .windows) {
            try self.client.ca_bundle.rescan(allocator);
            const start = self.client.ca_bundle.bytes.items.len;
            try self.client.ca_bundle.bytes.appendSlice(allocator, @embedFile("../windows/amazon1.cer"));
            try self.client.ca_bundle.parseCert(allocator, @intCast(start), std.time.timestamp());
        }

        self.server = try tk.Server.start(allocator, handler, .{
            .injector = tk.Injector.from(self),
            .port = 3002,
        });
    }

    pub fn deinit(self: *App) void {
        const thread = self.server.thread;
        self.server.deinit();
        thread.join();

        self.client.deinit();
        self.llama.deinit();
        self.db.close();
        _ = self.gpa.deinit();
    }
};

fn handler(injector: tk.Injector, req: *tk.Request, res: *tk.Response) anyerror!void {
    // handle API requests
    if (req.match("/api/*")) |_| {
        req.url.path = req.url.path[4..];
        return res.send(injector.call(tk.router(@import("api.zig")), .{}));
    }

    // TODO: should be .get() but it's not implemented yet
    if (req.match("/LICENSE.md")) |_| return res.sendResource("LICENSE.md");
    if (req.match("/favicon.ico")) |_| return res.sendResource("src/app/favicon.ico");
    if (req.match("/app.js")) |_| return res.sendResource("zig-out/app/main.js");

    // disable source maps in production
    if (req.match("*.map")) |_| return res.send("{}");

    // HTML5 fallback
    try res.sendResource("src/app/index.html");
}
