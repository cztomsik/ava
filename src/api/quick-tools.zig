const std = @import("std");
const fr = @import("fridge");
const schema = @import("../schema.zig");

pub fn @"GET /quick-tools"(db: *fr.Session) ![]const schema.QuickTool {
    return db.findAll(fr.query(schema.QuickTool).orderBy(.id, .asc));
}

pub fn @"GET /quick-tools/:id"(db: *fr.Session, id: u32) !schema.QuickTool {
    return try db.find(schema.QuickTool, id) orelse error.NotFound;
}

pub fn @"POST /quick-tools"(db: *fr.Session, data: schema.QuickTool) !schema.QuickTool {
    return db.create(schema.QuickTool, data);
}

pub fn @"PUT /quick-tools/:id"(db: *fr.Session, id: u32, data: schema.QuickTool) !schema.QuickTool {
    return try db.update(schema.QuickTool, id, data) orelse error.NotFound;
}

pub fn @"DELETE /quick-tools/:id"(db: *fr.Session, id: u32) !void {
    try db.delete(schema.QuickTool, id);
}
