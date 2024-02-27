const std = @import("std");
const tk = @import("tokamak");
const sqlite = @import("ava-sqlite");
const schema = @import("../schema.zig");

pub fn @"GET /chat"(db: *sqlite.SQLite3, res: *tk.Response) !void {
    var stmt = try db.query(
        \\SELECT id, name,
        \\(SELECT content FROM ChatMessage WHERE chat_id = Chat.id ORDER BY id DESC LIMIT 1) as last_message
        \\FROM Chat ORDER BY id DESC
    , .{});
    defer stmt.deinit();

    return res.sendJson(stmt.iterator(struct { id: u32, name: []const u8, last_message: ?[]const u8 }));
}

pub fn @"POST /chat"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, data: schema.Chat) !schema.Chat {
    return db.getAlloc(
        allocator,
        schema.Chat,
        "INSERT INTO Chat (name, prompt) VALUES (?, ?) RETURNING *",
        .{ data.name, data.prompt },
    );
}

pub fn @"GET /chat/:id"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, id: u32) !schema.Chat {
    return db.getAlloc(
        allocator,
        schema.Chat,
        "SELECT * FROM Chat WHERE id = ?",
        .{id},
    );
}

pub fn @"PUT /chat/:id"(db: *sqlite.SQLite3, id: u32, data: schema.Chat) !void {
    try db.exec(
        "UPDATE Chat SET name = ?, prompt = ? WHERE id = ?",
        .{ data.name, data.prompt, id },
    );
}

pub fn @"GET /chat/:id/messages"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, id: u32) ![]const schema.ChatMessage {
    return db.getAll(
        allocator,
        schema.ChatMessage,
        "SELECT * FROM ChatMessage WHERE chat_id = ? ORDER BY id",
        .{id},
    );
}

pub fn @"POST /chat/:id/messages"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, id: u32, data: schema.ChatMessage) !schema.ChatMessage {
    return db.getAlloc(
        allocator,
        schema.ChatMessage,
        "INSERT INTO ChatMessage (chat_id, role, content) VALUES (?, ?, ?) RETURNING *",
        .{ id, data.role, data.content },
    );
}

pub fn @"GET /chat/:id/messages/:message_id"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, id: u32, message_id: u32) !schema.ChatMessage {
    return db.getAlloc(
        allocator,
        schema.ChatMessage,
        "SELECT * FROM ChatMessage WHERE id = ? AND chat_id = ?",
        .{ message_id, id },
    );
}

pub fn @"PUT /chat/:id/messages/:message_id"(db: *sqlite.SQLite3, id: u32, message_id: u32, data: schema.ChatMessage) !void {
    try db.exec(
        "UPDATE ChatMessage SET role = ?, content = ? WHERE id = ? AND chat_id = ?",
        .{ data.role, data.content, message_id, id },
    );
}

pub fn @"DELETE /chat/:id/messages/:message_id"(db: *sqlite.SQLite3, id: u32, message_id: u32) !void {
    try db.exec(
        "DELETE FROM ChatMessage WHERE id = ? AND chat_id = ?",
        .{ message_id, id },
    );
}

pub fn @"DELETE /chat/:id"(db: *sqlite.SQLite3, id: u32) !void {
    try db.exec(
        "DELETE FROM Chat WHERE id = ?",
        .{id},
    );
}
