// TODO: rename this file

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
