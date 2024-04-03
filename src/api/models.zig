const std = @import("std");
const fr = @import("fridge");
const tk = @import("tokamak");
const schema = @import("../schema.zig");

const ModelWithSize = struct {
    id: ?u32 = null,
    name: []const u8,
    path: []const u8,
    imported: bool,
    size: usize,
};

pub fn @"GET /models"(db: *fr.Session) ![]const ModelWithSize {
    var rows = std.ArrayList(ModelWithSize).init(db.arena);

    for (try db.findAll(fr.query(schema.Model))) |m| {
        try rows.append(.{
            .id = m.id.?,
            .name = m.name,
            .path = m.path,
            .imported = m.imported,
            .size = getFileSize(m.path) catch 0,
        });
    }

    return rows.toOwnedSlice();
}

pub fn @"POST /models"(db: *fr.Session, data: schema.Model) !schema.Model {
    return db.create(schema.Model, data);
}

pub fn @"PUT /models/:id"(db: *fr.Session, id: u32, data: schema.Model) !schema.Model {
    try db.update(schema.Model, id, data);

    return try db.find(schema.Model, id) orelse error.NotFound;
}

pub fn @"DELETE /models/:id"(db: *fr.Session, id: u32) !void {
    const model = try db.find(schema.Model, id) orelse return;

    try db.delete(schema.Model, id);

    if (!model.imported) {
        std.fs.deleteFileAbsolute(model.path) catch {};
    }
}

fn getFileSize(path: []const u8) !u64 {
    const file = try std.fs.openFileAbsolute(path, .{ .mode = .read_only });
    defer file.close();

    return (try file.stat()).size;
}
