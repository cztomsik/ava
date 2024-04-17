const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const llama = @import("llama.zig");
const App = @import("app.zig").App;

pub const std_options = .{
    .log_level = .debug,
    .logFn = log,
};

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
var mutex = std.Thread.Mutex{};

pub var app: ?*App = null;

fn log(comptime level: std.log.Level, comptime scope: @Type(.EnumLiteral), comptime fmt: []const u8, args: anytype) void {
    if (app) |inst| {
        return inst.log(level, scope, fmt, args);
    }

    std.log.defaultLog(level, scope, fmt, args);
}

pub fn start() !void {
    if (app != null) {
        return error.ServerAlreadyStarted;
    }

    app = try App.init(gpa.allocator());
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
