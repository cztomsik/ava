const std = @import("std");
const tk = @import("tokamak");

pub fn @"POST /find-models"(allocator: std.mem.Allocator, r: *tk.Responder, params: struct { path: []const u8 }) !void {
    var models_found = std.ArrayList(struct { path: []const u8, size: ?u64 }).init(allocator);

    var dir = try std.fs.openDirAbsolute(params.path, .{ .iterate = true });
    defer dir.close();

    var walker = try dir.walk(allocator);
    defer walker.deinit();

    while (try walker.next()) |entry| switch (entry.kind) {
        .file => if (std.mem.endsWith(u8, entry.basename, ".gguf")) {
            const file = try dir.openFile(entry.path, .{ .mode = .read_only });
            defer file.close();

            try models_found.append(.{
                .path = try std.fs.path.join(allocator, &.{ params.path, entry.path }),
                .size = (try file.stat()).size,
            });
        },
        .directory => _ = if (walker.stack.items.len > 3) walker.stack.pop(),
        else => {},
    };

    return r.sendJson(models_found.items);
}
