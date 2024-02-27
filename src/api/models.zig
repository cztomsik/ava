const std = @import("std");
const sqlite = @import("ava-sqlite");
const tk = @import("tokamak");
const schema = @import("../schema.zig");
const util = @import("../util.zig");

pub fn @"GET /models"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, res: *tk.Response) !void {
    var stmt = try db.query("SELECT * FROM Model ORDER BY id", .{});
    defer stmt.deinit();

    var rows = std.ArrayList(struct { id: u32, name: []const u8, path: []const u8, imported: bool, size: ?u64 }).init(allocator);
    var it = stmt.iterator(schema.Model);
    while (try it.next()) |m| {
        try rows.append(.{
            .id = m.id.?,
            .name = try allocator.dupe(u8, m.name),
            .path = try allocator.dupe(u8, m.path),
            .imported = m.imported,
            .size = util.getFileSize(m.path) catch null,
        });
    }

    return res.sendJson(rows.items);
}

pub fn @"POST /models"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, data: schema.Model) !schema.Model {
    return db.getAlloc(
        allocator,
        schema.Model,
        "INSERT INTO Model (name, path, imported) VALUES (?, ?, ?) RETURNING *",
        .{ data.name, data.path, data.imported },
    );
}

pub fn @"PUT /models/:id"(db: *sqlite.SQLite3, id: u32, data: schema.Model) !void {
    try db.exec(
        "UPDATE Model SET name = ?, path = ? WHERE id = ?",
        .{ data.name, data.path, id },
    );
}

pub fn @"DELETE /models/:id"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, id: []const u8) !void {
    const path = try db.getString(allocator, "SELECT path FROM Model WHERE id = ?", .{id});
    const imported = try db.get(bool, "SELECT imported FROM Model WHERE id = ?", .{id});

    try db.exec("DELETE FROM Model WHERE id = ?", .{id});

    if (!imported) {
        std.fs.deleteFileAbsolute(path) catch {};
    }
}
