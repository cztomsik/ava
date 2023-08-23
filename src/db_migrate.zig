// inspired by https://david.rothlis.net/declarative-schema-migration-for-sqlite/

const std = @import("std");
const sqlite = @import("sqlite.zig");

pub fn migrate(db: *sqlite.SQLite3) !void {
    // try db.exec("PRAGMA foreign_keys = OFF", .{});

    // Create empty database with the target schema
    var pristine = try sqlite.SQLite3.open(":memory:");
    defer pristine.close();
    var parts = std.mem.splitSequence(u8, @embedFile("db_schema.sql"), ";\n");
    while (parts.next()) |sql| try pristine.exec(sql, .{});

    var tables = try pristine.prepare("SELECT name, sql FROM sqlite_master WHERE type = \"table\" AND name != \"sqlite_sequence\"");
    defer tables.deinit();

    var it = tables.iterator(struct { []const u8, []const u8 });
    while (try it.next()) |row| {
        if (try db.get(usize, "SELECT COUNT(*) FROM sqlite_master WHERE name = ?", .{row[0]}) == 0) {
            std.log.debug("Creating table: {s}", .{row[0]});
            try db.exec(row[1], .{});
        }
    }

    // try db.exec("PRAGMA journal_mode = WAL", .{});
    // try db.exec("PRAGMA synchronous = FULL", .{});
    // try db.exec("PRAGMA foreign_keys = ON", .{});
}
