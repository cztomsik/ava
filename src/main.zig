const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const llama = @import("llama.zig");
const util = @import("util.zig");
const App = @import("app.zig").App;

pub var app: ?App = null;

pub const std_options = .{
    .log_level = .debug,
    .logFn = util.Logger.log,
};

pub fn embedFile(comptime path: []const u8) []const u8 {
    return @embedFile("../" ++ path);
}

pub fn start() !void {
    if (app != null) {
        return error.ServerAlreadyStarted;
    }

    app = undefined;
    try App.init(&app.?);
}

pub export fn ava_start() c_int {
    start() catch |e| {
        std.log.err("Unexpected error: {}", .{e});
        return 1;
    };

    return 0;
}

pub export fn ava_get_port() c_int {
    return if (app == null) -1 else app.?.server.net.listen_address.getPort();
}

pub export fn ava_stop() c_int {
    if (app == null) return 1;

    app.?.deinit();
    app = null;
    return 0;
}
