const tk = @import("tokamak");
const ava = @import("../app.zig");

pub fn @"GET /log"(ctx: *tk.Context, app: *ava.App) !void {
    try ctx.res.setHeader("Content-Type", "text/plain");
    try ctx.res.send(try app.dumpLog(ctx.allocator));
}
