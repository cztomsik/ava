const std = @import("std");

pub fn getFileSize(path: []const u8) !u64 {
    const file = try std.fs.openFileAbsolute(path, .{ .mode = .read_only });
    defer file.close();

    return (try file.stat()).size;
}
