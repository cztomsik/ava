const std = @import("std");
const ava = @import("../app.zig");

pub fn @"GET /log"(allocator: std.mem.Allocator, logger: *ava.Logger) ![]const u8 {
    return logger.dump(allocator);
}
