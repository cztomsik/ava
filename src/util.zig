const builtin = @import("builtin");
const std = @import("std");

pub fn getHome(allocator: std.mem.Allocator) ![]const u8 {
    return std.fs.getAppDataDir(allocator, "AvaPLS");
}

pub fn getHomePath(allocator: std.mem.Allocator, paths: []const []const u8) ![:0]const u8 {
    const home = try getHome(allocator);
    defer allocator.free(home);

    const arr = try allocator.alloc([]const u8, paths.len + 1);
    defer allocator.free(arr);
    arr[0] = home;
    for (paths, 1..) |p, i| arr[i] = p;

    return std.fs.path.joinZ(allocator, arr);
}

pub fn getWritableHomePath(allocator: std.mem.Allocator, paths: []const []const u8) ![:0]const u8 {
    const res = try getHomePath(allocator, paths);
    std.fs.makeDirAbsolute(std.fs.path.dirname(res).?) catch {};

    return res;
}

pub fn getFileSize(path: []const u8) !u64 {
    const file = try std.fs.openFileAbsolute(path, .{ .mode = .read_only });
    defer file.close();

    return (try file.stat()).size;
}

pub const Logger = struct {
    var mutex: std.Thread.Mutex = .{};
    var file: ?std.fs.File = null;

    fn writer() std.fs.File.Writer {
        if (file == null) {
            if (comptime builtin.mode == .Debug) {
                file = std.io.getStdErr();
            } else {
                const path = getWritableHomePath(std.heap.page_allocator, &.{"log.txt"}) catch @panic("Failed to get log path");
                var f = std.fs.createFileAbsolute(path, .{}) catch @panic("Failed to open log file");
                f.seekTo(0) catch {};

                file = f;
            }
        }

        return file.?.writer();
    }

    pub fn log(
        comptime level: std.log.Level,
        comptime scope: @Type(.EnumLiteral),
        comptime format: []const u8,
        args: anytype,
    ) void {
        mutex.lock();
        defer mutex.unlock();

        const t = @mod(std.time.timestamp(), 86_400);
        const s = @mod(t, 60);
        const m = @divTrunc(@mod(t, 3_600), 60);
        const h = @divTrunc(t, 3_600);

        writer().print("{d:.2}:{d:.2}:{d:.2} " ++ level.asText() ++ " " ++ @tagName(scope) ++ ": " ++ format ++ "\n", .{ h, m, s } ++ args) catch return;
    }
};
