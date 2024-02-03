const db = @import("../db.zig");
const tk = @import("tokamak");

pub fn @"GET /chat"(r: *tk.Responder) !void {
    var stmt = try db.query(
        \\SELECT id, name,
        \\(SELECT content FROM ChatMessage WHERE chat_id = Chat.id ORDER BY id DESC LIMIT 1) as last_message
        \\FROM Chat ORDER BY id DESC
    , .{});
    defer stmt.deinit();

    return r.sendJson(stmt.iterator(struct { id: u32, name: []const u8, last_message: ?[]const u8 }));
}

pub fn @"POST /chat"(r: *tk.Responder, data: db.Chat) !void {
    var stmt = try db.query("INSERT INTO Chat (name, prompt) VALUES (?, ?) RETURNING *", .{ data.name, data.prompt });
    defer stmt.deinit();

    try r.sendJson(try stmt.read(db.Chat));
}

pub fn @"GET /chat/:id"(r: *tk.Responder, id: u32) !void {
    var stmt = try db.query("SELECT * FROM Chat WHERE id = ?", .{id});
    defer stmt.deinit();

    return r.sendJson(try stmt.read(db.Chat));
}

pub fn @"PUT /chat/:id"(r: *tk.Responder, id: u32, data: db.Chat) !void {
    try db.exec("UPDATE Chat SET name = ?, prompt = ? WHERE id = ?", .{ data.name, data.prompt, id });
    return r.noContent();
}

pub fn @"GET /chat/:id/messages"(r: *tk.Responder, id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE chat_id = ? ORDER BY id", .{id});
    defer stmt.deinit();

    return r.sendJson(stmt.iterator(db.ChatMessage));
}

pub fn @"POST /chat/:id/messages"(r: *tk.Responder, id: u32, data: db.ChatMessage) !void {
    var stmt = try db.query("INSERT INTO ChatMessage (chat_id, role, content) VALUES (?, ?, ?) RETURNING *", .{ id, data.role, data.content });
    defer stmt.deinit();

    try r.sendJson(try stmt.read(db.ChatMessage));
}

pub fn @"GET /chat/:id/messages/:message_id"(r: *tk.Responder, id: u32, message_id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
    defer stmt.deinit();

    return r.sendJson(try stmt.read(db.ChatMessage));
}

pub fn @"PUT /chat/:id/messages/:message_id"(r: *tk.Responder, id: u32, message_id: u32, data: db.ChatMessage) !void {
    try db.exec("UPDATE ChatMessage SET role = ?, content = ? WHERE id = ? AND chat_id = ?", .{ data.role, data.content, message_id, id });
    return r.noContent();
}

pub fn @"DELETE /chat/:id/messages/:message_id"(r: *tk.Responder, id: u32, message_id: u32) !void {
    try db.exec("DELETE FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
    return r.noContent();
}

pub fn @"DELETE /chat/:id"(r: *tk.Responder, id: u32) !void {
    try db.exec("DELETE FROM Chat WHERE id = ?", .{id});
    return r.noContent();
}
