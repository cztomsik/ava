const std = @import("std");
const server = @import("../server.zig");

pub fn @"POST /find-models"(ctx: *server.Context) !void {
    var models_found = std.ArrayList(struct { path: []const u8, size: ?u64 }).init(ctx.arena);

    const path = try ctx.readJson([]const u8);

    var dir = try std.fs.openDirAbsolute(path, .{ .iterate = true });
    defer dir.close();

    var walker = try dir.walk(ctx.arena);
    defer walker.deinit();

    while (try walker.next()) |entry| switch (entry.kind) {
        .file => if (std.mem.endsWith(u8, entry.basename, ".gguf")) {
            const file = try dir.openFile(entry.path, .{ .mode = .read_only });
            defer file.close();

            try models_found.append(.{
                .path = try std.fs.path.join(ctx.arena, &.{ path, entry.path }),
                .size = (try file.stat()).size,
            });
        },
        .directory => _ = if (walker.stack.items.len > 3) walker.stack.pop(),
        else => {},
    };

    return ctx.sendJson(models_found.items);
}
