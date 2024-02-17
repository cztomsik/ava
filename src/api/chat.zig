const tk = @import("tokamak");
const sqlite = @import("ava-sqlite");
const schema = @import("../schema.zig");

pub fn @"GET /chat"(db: *sqlite.SQLite3, r: *tk.Responder) !void {
    var stmt = try db.query(
        \\SELECT id, name,
        \\(SELECT content FROM ChatMessage WHERE chat_id = Chat.id ORDER BY id DESC LIMIT 1) as last_message
        \\FROM Chat ORDER BY id DESC
    , .{});
    defer stmt.deinit();

    return r.sendJson(stmt.iterator(struct { id: u32, name: []const u8, last_message: ?[]const u8 }));
}

pub fn @"POST /chat"(db: *sqlite.SQLite3, r: *tk.Responder, data: schema.Chat) !void {
    var stmt = try db.query("INSERT INTO Chat (name, prompt) VALUES (?, ?) RETURNING *", .{ data.name, data.prompt });
    defer stmt.deinit();

    try r.sendJson(try stmt.read(schema.Chat));
}

pub fn @"GET /chat/:id"(db: *sqlite.SQLite3, r: *tk.Responder, id: u32) !void {
    var stmt = try db.query("SELECT * FROM Chat WHERE id = ?", .{id});
    defer stmt.deinit();

    return r.sendJson(try stmt.read(schema.Chat));
}

pub fn @"PUT /chat/:id"(db: *sqlite.SQLite3, id: u32, data: schema.Chat) !void {
    try db.exec("UPDATE Chat SET name = ?, prompt = ? WHERE id = ?", .{ data.name, data.prompt, id });
}

pub fn @"GET /chat/:id/messages"(db: *sqlite.SQLite3, r: *tk.Responder, id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE chat_id = ? ORDER BY id", .{id});
    defer stmt.deinit();

    return r.sendJson(stmt.iterator(schema.ChatMessage));
}

pub fn @"POST /chat/:id/messages"(db: *sqlite.SQLite3, r: *tk.Responder, id: u32, data: struct { role: []const u8, content: []const u8 }) !void {
    var stmt = try db.query("INSERT INTO ChatMessage (chat_id, role, content) VALUES (?, ?, ?) RETURNING *", .{ id, data.role, data.content });
    defer stmt.deinit();

    try r.sendJson(try stmt.read(schema.ChatMessage));
}

pub fn @"GET /chat/:id/messages/:message_id"(db: *sqlite.SQLite3, r: *tk.Responder, id: u32, message_id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
    defer stmt.deinit();

    return r.sendJson(try stmt.read(schema.ChatMessage));
}

pub fn @"PUT /chat/:id/messages/:message_id"(db: *sqlite.SQLite3, id: u32, message_id: u32, data: schema.ChatMessage) !void {
    try db.exec("UPDATE ChatMessage SET role = ?, content = ? WHERE id = ? AND chat_id = ?", .{ data.role, data.content, message_id, id });
}

pub fn @"DELETE /chat/:id/messages/:message_id"(db: *sqlite.SQLite3, id: u32, message_id: u32) !void {
    try db.exec("DELETE FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
}

pub fn @"DELETE /chat/:id"(db: *sqlite.SQLite3, id: u32) !void {
    try db.exec("DELETE FROM Chat WHERE id = ?", .{id});
}
