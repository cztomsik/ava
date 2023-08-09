const std = @import("std");
const server = @import("../server.zig");

pub fn handler(ctx: *server.Context) !void {
    // try ctx.sendJson("Hello, World!");
    try ctx.send("Hello, world!\n");
}
