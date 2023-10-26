const db = @import("../db.zig");
const server = @import("../server.zig");

pub fn @"GET /chat"(ctx: *server.Context) !void {
    var stmt = try db.query(
        \\SELECT id, name,
        \\(SELECT content FROM ChatMessage WHERE chat_id = Chat.id ORDER BY id DESC LIMIT 1) as last_message
        \\FROM Chat ORDER BY id DESC
    , .{});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(struct { id: u32, name: []const u8, last_message: ?[]const u8 }));
}

pub fn @"POST /chat"(ctx: *server.Context) !void {
    const data = try ctx.readJson(struct {
        name: []const u8,
        prompt: ?[]const u8,
    });

    var stmt = try db.query("INSERT INTO Chat (name, prompt) VALUES (?, ?) RETURNING *", .{ data.name, data.prompt });
    defer stmt.deinit();

    try ctx.sendJson(try stmt.read(db.Chat));
}

pub fn @"GET /chat/:id"(ctx: *server.Context, id: u32) !void {
    var stmt = try db.query("SELECT * FROM Chat WHERE id = ?", .{id});
    defer stmt.deinit();

    return ctx.sendJson(try stmt.read(db.Chat));
}

pub fn @"PUT /chat/:id"(ctx: *server.Context, id: u32, data: db.Chat) !void {
    try db.exec("UPDATE Chat SET name = ?, prompt = ? WHERE id = ?", .{ data.name, data.prompt, id });
    return ctx.noContent();
}

pub fn @"GET /chat/:id/messages"(ctx: *server.Context, id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE chat_id = ? ORDER BY id", .{id});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(db.ChatMessage));
}

pub fn @"POST /chat/:id/messages"(ctx: *server.Context, id: u32) !void {
    const data = try ctx.readJson(struct {
        role: []const u8,
        content: []const u8,
    });

    var stmt = try db.query("INSERT INTO ChatMessage (chat_id, role, content) VALUES (?, ?, ?) RETURNING *", .{ id, data.role, data.content });
    defer stmt.deinit();

    try ctx.sendJson(try stmt.read(db.ChatMessage));
}

pub fn @"GET /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
    defer stmt.deinit();

    return ctx.sendJson(try stmt.read(db.ChatMessage));
}

pub fn @"PUT /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    const data = try ctx.readJson(struct {
        role: []const u8,
        content: []const u8,
    });

    try db.exec("UPDATE ChatMessage SET role = ?, content = ? WHERE id = ? AND chat_id = ?", .{ data.role, data.content, message_id, id });
    return ctx.noContent();
}

pub fn @"DELETE /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    try db.exec("DELETE FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
    return ctx.noContent();
}

pub fn @"DELETE /chat/:id"(ctx: *server.Context, id: u32) !void {
    try db.exec("DELETE FROM Chat WHERE id = ?", .{id});
    return ctx.noContent();
}
