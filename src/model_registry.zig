const std = @import("std");
const platform = @import("platform.zig");

pub const Model = struct {
    name: []const u8,
    size: usize,
};

pub fn getModelPath(allocator: std.mem.Allocator, model_name: []const u8) ![]const u8 {
    return std.fmt.allocPrintZ(allocator, "{s}/{s}/{s}.gguf", .{
        platform.getHome(),
        "Downloads",
        std.fs.path.basename(model_name),
    });
}

pub fn getModels(allocator: std.mem.Allocator) ![]Model {
    var list = std.ArrayList(Model).init(allocator);
    var path = try std.fmt.allocPrintZ(allocator, "{s}/{s}", .{ platform.getHome(), "Downloads" });
    defer allocator.free(path);

    var dir = try std.fs.openIterableDirAbsoluteZ(path, .{});
    defer dir.close();

    var it = dir.iterate();

    while (try it.next()) |entry| {
        const file = try dir.dir.openFile(entry.name, .{ .mode = .read_only });
        defer file.close();

        if (entry.kind == .file and std.mem.endsWith(u8, entry.name, ".gguf")) {
            try list.append(.{
                .name = try allocator.dupe(u8, entry.name[0 .. entry.name.len - 5]),
                .size = (try file.stat()).size,
            });
        }
    }

    return list.toOwnedSlice();
}

pub fn deleteModel(allocator: std.mem.Allocator, model_name: []const u8) !void {
    const path = try getModelPath(allocator, model_name);
    try std.fs.deleteFileAbsolute(path);
}
