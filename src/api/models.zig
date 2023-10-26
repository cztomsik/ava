const std = @import("std");
const db = @import("../db.zig");
const server = @import("../server.zig");
const util = @import("../util.zig");

pub fn @"GET /models"(ctx: *server.Context) !void {
    var stmt = try db.query("SELECT * FROM Model ORDER BY id", .{});
    defer stmt.deinit();

    var rows = std.ArrayList(struct { id: u32, name: []const u8, path: []const u8, imported: bool, size: ?u64 }).init(ctx.arena);
    var it = stmt.iterator(db.Model);
    while (try it.next()) |m| {
        try rows.append(.{
            .id = m.id,
            .name = try ctx.arena.dupe(u8, m.name),
            .path = try ctx.arena.dupe(u8, m.path),
            .imported = m.imported,
            .size = util.getFileSize(m.path) catch null,
        });
    }

    return ctx.sendJson(rows.items);
}

pub fn @"POST /models"(ctx: *server.Context) !void {
    const data = try ctx.readJson(struct {
        name: []const u8,
        path: []const u8,
        imported: bool = false,
    });

    var stmt = try db.query("INSERT INTO Model (name, path, imported) VALUES (?, ?, ?) RETURNING *", .{ data.name, data.path, data.imported });
    defer stmt.deinit();

    try ctx.sendJson(try stmt.read(db.Model));
}

pub fn @"PUT /models/:id"(ctx: *server.Context, id: u32, data: db.Model) !void {
    try db.exec("UPDATE Model SET name = ?, path = ? WHERE id = ?", .{ data.name, data.path, id });
    return ctx.noContent();
}

pub fn @"DELETE /models/:id"(ctx: *server.Context, id: []const u8) !void {
    const path = try db.getString(ctx.arena, "SELECT path FROM Model WHERE id = ?", .{id});
    const imported = try db.get(bool, "SELECT imported FROM Model WHERE id = ?", .{id});
    try db.exec("DELETE FROM Model WHERE id = ?", .{id});
    if (!imported) std.fs.deleteFileAbsolute(path) catch {};
    return ctx.noContent();
}
