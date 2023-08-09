const std = @import("std");
const server = @import("../server.zig");

const Params = struct {
    prompt: []const u8,
};

pub fn handler(ctx: *server.Context) !void {
    const params = try ctx.readJson(Params);

    try ctx.sendJson(.{ .content = params.prompt });

    try ctx.sendJson(.{ .content = "Hello" });

    _ = std.c.nanosleep(&.{
        .tv_sec = 2,
        .tv_nsec = 0,
    }, null);

    try ctx.sendJson(.{ .content = "World" });
}
