const std = @import("std");
const server = @import("../server.zig");
const completion = @import("completion.zig").handler;

pub fn handler(ctx: *server.Context) !void {
    const path = ctx.path[5..];

    if (std.mem.eql(u8, path, "completion")) {
        return completion(ctx);
    }

    return error.NotFound;
}
