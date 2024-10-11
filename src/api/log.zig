const std = @import("std");
const ava = @import("../app.zig");

pub fn @"GET /log"(allocator: std.mem.Allocator, app: *ava.App) ![]const u8 {
    return app.dumpLog(allocator);
}
