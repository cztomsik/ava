const std = @import("std");
const platform = @import("platform.zig");
const sqlite = @import("sqlite.zig");

var db: sqlite.SQLite3 = undefined;

pub fn init(allocator: std.mem.Allocator) !void {
    var db_file = try std.fmt.allocPrintZ(allocator, "{s}/Library/Application Support/AvaPLS/db", .{platform.getHome()});
    defer allocator.free(db_file);

    std.fs.makeDirAbsolute(std.fs.path.dirname(db_file).?) catch {};
    db = try sqlite.SQLite3.open(db_file);

    try run_migrations();
}

pub fn version() ![]const u8 {
    return try db.one([]const u8, "SELECT sqlite_version()", .{});
}

fn run_migrations() !void {
    // Empty for now
}
