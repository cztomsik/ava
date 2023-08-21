const std = @import("std");
const platform = @import("platform.zig");
const sqlite = @import("sqlite.zig");

var db: sqlite.SQLite3 = undefined;

pub fn init(allocator: std.mem.Allocator) !void {
    var db_file = try std.fmt.allocPrintZ(allocator, "{s}/Library/Application Support/AvaPLS/db", .{platform.getHome()});
    defer allocator.free(db_file);

    std.fs.makeDirAbsolute(std.fs.path.dirname(db_file).?) catch {};
    db = try sqlite.SQLite3.open(db_file);
}

pub fn deinit() void {
    db.close() catch |e| std.log.warn("Failed to close database: {!}\n", .{e});
}

pub fn query(sql: []const u8, args: anytype) !sqlite.Statement {
    var stmt = try db.prepare(sql);
    try stmt.bindAll(args);
    return stmt;
}
