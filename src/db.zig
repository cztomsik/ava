const sqlite = @import("sqlite.zig");

var db: *sqlite.SQLite3 = undefined;

pub fn init() !void {
    db = try sqlite.SQLite3.open("ava.db");

    try run_migrations();
}

pub fn version() ![]const u8 {
    return try db.one([]const u8, "SELECT sqlite_version()", .{});
}

fn run_migrations() !void {
    // Empty for now
}
