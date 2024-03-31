const tk = @import("tokamak");
const util = @import("../util.zig");

pub fn @"GET /log"(ctx: *tk.Context) !void {
    try ctx.res.setHeader("Content-Type", "text/plain");
    try ctx.res.send(try util.Logger.dump(ctx.allocator));
}
