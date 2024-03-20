const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const llama = @import("llama.zig");
const util = @import("util.zig");

/// Shared application state.
pub const App = struct {
    gpa: std.heap.GeneralPurposeAllocator(.{}),
    allocator: std.mem.Allocator,
    db_pool: fr.Pool,
    llama: llama.Pool,
    client: std.http.Client,
    server: *tk.Server,

    pub fn init(self: *App) !void {
        self.gpa = .{};
        var allocator = self.gpa.allocator();

        const db_file = try util.getWritableHomePath(allocator, &.{"db"});
        defer allocator.free(db_file);

        try fr.migrate(allocator, db_file, @embedFile("db_schema.sql"));

        self.db_pool = try fr.Pool.init(allocator, db_file, 2);
        self.llama = llama.Pool.init(allocator);
        self.client = .{ .allocator = allocator };

        if (builtin.target.os.tag == .windows) {
            try self.client.ca_bundle.rescan(allocator);
            const start = self.client.ca_bundle.bytes.items.len;
            try self.client.ca_bundle.bytes.appendSlice(allocator, @embedFile("windows/amazon1.cer"));
            try self.client.ca_bundle.parseCert(allocator, @intCast(start), std.time.timestamp());
        }

        self.server = try tk.Server.start(allocator, handler, .{
            .injector = try tk.Injector.from(.{ &allocator, &self.db_pool, &self.llama, &self.client }),
            .port = 3002,
            .keep_alive = false,
        });
    }

    pub fn deinit(self: *App) void {
        self.server.deinit();
        self.client.deinit();
        self.llama.deinit();
        self.db_pool.deinit();
        _ = self.gpa.deinit();
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
