const std = @import("std");
const fr = @import("fridge");
const schema = @import("../schema.zig");

pub fn @"GET /prompts"(db: *fr.Session) ![]const schema.Prompt {
    return db.findAll(fr.query(schema.Prompt).orderBy(.id, .asc));
}

pub fn @"POST /prompts"(db: *fr.Session, data: schema.Prompt) !schema.Prompt {
    return db.create(schema.Prompt, data);
}

pub fn @"DELETE /prompts/:id"(db: *fr.Session, id: u32) !void {
    try db.delete(schema.Prompt, id);
}
