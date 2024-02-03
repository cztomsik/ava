const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const db = @import("db.zig");
const llama = @import("llama.zig");
const util = @import("util.zig");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = if (builtin.mode == .Debug) gpa.allocator() else std.heap.c_allocator;

pub var server: ?*tk.Server = null;

pub const std_options = struct {
    pub const log_level = .debug;
    pub const logFn = util.Logger.log;
};

pub fn embedFile(comptime path: []const u8) []const u8 {
    return @embedFile("../" ++ path);
}

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

pub fn start() !void {
    if (server != null) {
        return error.ServerAlreadyStarted;
    }

    llama.init(allocator);
    try db.init(allocator);

    server = try tk.Server.start(allocator, handler, .{ .port = 3002 });
}

pub export fn ava_start() c_int {
    start() catch |e| {
        std.log.err("Unexpected error: {}", .{e});
        return 1;
    };

    server.?.thread.detach();

    return 0;
}

pub export fn ava_get_port() c_int {
    return if (server == null) -1 else server.?.http.socket.listen_address.getPort();
}

pub export fn ava_stop() c_int {
    if (server == null) return 1;

    server.?.deinit();
    db.deinit();
    llama.deinit();
    if (builtin.mode == .Debug) _ = gpa.deinit();
    server = null;
    return 0;
}
