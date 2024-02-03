const std = @import("std");
const db = @import("../db.zig");
const tk = @import("tokamak");
const util = @import("../util.zig");

pub fn @"GET /models"(allocator: std.mem.Allocator, r: *tk.Responder) !void {
    var stmt = try db.query("SELECT * FROM Model ORDER BY id", .{});
    defer stmt.deinit();

    var rows = std.ArrayList(struct { id: u32, name: []const u8, path: []const u8, imported: bool, size: ?u64 }).init(allocator);
    var it = stmt.iterator(db.Model);
    while (try it.next()) |m| {
        try rows.append(.{
            .id = m.id.?,
            .name = try allocator.dupe(u8, m.name),
            .path = try allocator.dupe(u8, m.path),
            .imported = m.imported,
            .size = util.getFileSize(m.path) catch null,
        });
    }

    return r.sendJson(rows.items);
}

pub fn @"POST /models"(r: *tk.Responder, data: db.Model) !void {
    var stmt = try db.query("INSERT INTO Model (name, path, imported) VALUES (?, ?, ?) RETURNING *", .{ data.name, data.path, data.imported });
    defer stmt.deinit();

    try r.sendJson(try stmt.read(db.Model));
}

pub fn @"PUT /models/:id"(r: *tk.Responder, id: u32, data: db.Model) !void {
    try db.exec("UPDATE Model SET name = ?, path = ? WHERE id = ?", .{ data.name, data.path, id });
    return r.noContent();
}

pub fn @"DELETE /models/:id"(allocator: std.mem.Allocator, r: *tk.Responder, id: []const u8) !void {
    const path = try db.getString(allocator, "SELECT path FROM Model WHERE id = ?", .{id});
    const imported = try db.get(bool, "SELECT imported FROM Model WHERE id = ?", .{id});
    try db.exec("DELETE FROM Model WHERE id = ?", .{id});
    if (!imported) std.fs.deleteFileAbsolute(path) catch {};
    return r.noContent();
}
