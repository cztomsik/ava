const builtin = @import("builtin");
const std = @import("std");
const db = @import("db.zig");
const llama = @import("llama.zig");
const Server = @import("server.zig").Server;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = if (builtin.mode == .Debug) gpa.allocator() else std.heap.c_allocator;

var server: ?*Server = null;

pub const std_options = struct {
    pub const log_level = .debug;
};

pub export fn ava_start() c_int {
    if (server != null) {
        std.log.err("Server already started", .{});
        return 1;
    }

    llama.init(allocator);

    db.init(allocator) catch |err| {
        std.log.err("DB error: {}", .{err});
        return 1;
    };

    server = Server.start(allocator, "127.0.0.1", 3002) catch |err| {
        std.log.err("Server error: {}", .{err});
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
