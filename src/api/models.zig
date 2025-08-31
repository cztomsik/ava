const std = @import("std");
const fr = @import("fridge");
const tk = @import("tokamak");
const llama = @import("../llama.zig");
const schema = @import("../schema.zig");

const ModelRow = struct {
    id: ?u32 = null,
    name: []const u8,
    path: []const u8,
    imported: bool,
    size: usize,
};

const Meta = struct {
    key: [:0]const u8,
    value: [:0]const u8,
};

pub fn @"GET /models"(db: *fr.Session) ![]const ModelRow {
    var rows = std.array_list.Managed(ModelRow).init(db.arena);

    for (try db.query(schema.Model).findAll()) |m| {
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

pub fn @"GET /models/:id"(db: *fr.Session, id: u32) !schema.Model {
    return try db.find(schema.Model, id) orelse error.NotFound;
}

pub fn @"GET /models/:id/meta"(db: *fr.Session, id: u32) ![]Meta {
    const model = try db.find(schema.Model, id) orelse return error.NotFound;

    var llama_model = try llama.Model.loadFromFile(db.arena, model.path, .{});
    defer llama_model.deinit();

    const res = try db.arena.alloc(Meta, llama_model.metaCount());

    for (res, 0..) |*meta, i| {
        meta.key = try llama_model.metaKey(db.arena, i) orelse "";
        meta.value = try llama_model.metaValue(db.arena, meta.key) orelse "";
    }

    return res;
}

pub fn @"POST /models"(db: *fr.Session, data: schema.Model) !schema.Model {
    return db.create(schema.Model, data);
}

pub fn @"PUT /models/:id"(db: *fr.Session, id: u32, data: schema.Model) !void {
    try db.update(schema.Model, id, data);
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
