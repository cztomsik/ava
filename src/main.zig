const builtin = @import("builtin");
const std = @import("std");
const db = @import("db.zig");
const llama = @import("llama.zig");
const Server = @import("server.zig").Server;
const util = @import("util.zig");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = if (builtin.mode == .Debug) gpa.allocator() else std.heap.c_allocator;

var server: ?*Server = null;

pub const std_options = struct {
    pub const log_level = .debug;
    pub const logFn = util.Logger.log;
};

// This is only used for the headless build
pub fn main() !void {
    std.log.debug("Starting the server", .{});
    try start();

    const banner =
        \\
        \\  /\ \  / /\             Server running
        \\ /--\ \/ /--\            http://{}
        \\ _____________________________________________
        \\
        \\
    ;

    std.debug.print(banner, .{
        server.?.http.socket.listen_address,
    });

    server.?.thread.join();

    std.log.debug("Stopping the server", .{});
    _ = ava_stop();
}

pub fn start() !void {
    if (server != null) {
        return error.ServerAlreadyStarted;
    }

    llama.init(allocator);
    try db.init(allocator);

    server = try Server.start(allocator, "127.0.0.1", 3002);
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
