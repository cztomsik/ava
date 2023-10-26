const server = @import("../server.zig");
const util = @import("../util.zig");

pub fn @"GET /log"(ctx: *server.Context) !void {
    try ctx.sendChunk(try util.Logger.dump(ctx.arena));
}
