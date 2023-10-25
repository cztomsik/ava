const builtin = @import("builtin");
const std = @import("std");
const server = @import("../server.zig");

pub fn @"GET /system-info"(ctx: *server.Context) !void {
    const user_home = try std.process.getEnvVarOwned(ctx.arena, if (builtin.target.os.tag == .windows) "USERPROFILE" else "HOME");
    const user_downloads = try std.fs.path.join(ctx.arena, &.{ user_home, "Downloads" });

    return ctx.sendJson(.{
        .os = builtin.os.tag,
        .user_home = user_home,
        .user_downloads = user_downloads,
    });
}
