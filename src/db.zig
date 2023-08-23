const std = @import("std");
const platform = @import("platform.zig");
const sqlite = @import("sqlite.zig");
const migrate = @import("db_migrate.zig").migrate;

var db: sqlite.SQLite3 = undefined;

pub fn init(allocator: std.mem.Allocator) !void {
    var db_file = try std.fmt.allocPrintZ(allocator, "{s}/Library/Application Support/AvaPLS/db", .{platform.getHome()});
    defer allocator.free(db_file);

    std.fs.makeDirAbsolute(std.fs.path.dirname(db_file).?) catch {};
    db = try sqlite.SQLite3.open(db_file);

    try migrate(&db);
}

pub fn deinit() void {
    db.close();
}

pub fn exec(sql: []const u8, args: anytype) !void {
    return db.exec(sql, args);
}

pub fn query(sql: []const u8, args: anytype) !sqlite.Statement {
    return db.query(sql, args);
}
