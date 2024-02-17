const std = @import("std");
const sqlite = @import("ava-sqlite");
const schema = @import("../schema.zig");

pub fn @"GET /prompts"(allocator: std.mem.Allocator, db: *sqlite.SQLite3) ![]const schema.Prompt {
    return db.getAll(
        allocator,
        schema.Prompt,
        "SELECT * FROM Prompt ORDER BY id",
        .{},
    );
}

pub fn @"POST /prompts"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, data: schema.Prompt) !schema.Prompt {
    return db.getAlloc(
        allocator,
        schema.Prompt,
        "INSERT INTO Prompt (name, prompt) VALUES (?, ?) RETURNING *",
        .{ data.name, data.prompt },
    );
}

pub fn @"DELETE /prompts/:id"(db: *sqlite.SQLite3, id: u32) !void {
    try db.exec(
        "DELETE FROM Prompt WHERE id = ?",
        .{id},
    );
}
