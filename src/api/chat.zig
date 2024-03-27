const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const schema = @import("../schema.zig");

pub fn @"GET /chat"(db: *fr.Session) ![]const schema.ChatWithLastMessage {
    return db.findAll(fr.query(schema.ChatWithLastMessage).orderBy(.id, .desc));
}

pub fn @"POST /chat"(db: *fr.Session, data: schema.Chat) !schema.Chat {
    return db.create(schema.Chat, data);
}

pub fn @"GET /chat/:id"(db: *fr.Session, id: u32) !schema.Chat {
    return try db.find(schema.Chat, id) orelse error.NotFound;
}

pub fn @"PUT /chat/:id"(db: *fr.Session, id: u32, data: schema.Chat) !schema.Chat {
    try db.update(schema.Chat, id, data);

    return try db.find(schema.Chat, id) orelse error.NotFound;
}

pub fn @"GET /chat/:id/messages"(db: *fr.Session, id: u32) ![]const schema.ChatMessage {
    return db.findAll(
        fr.query(schema.ChatMessage).where(.{ .chat_id = id }).orderBy(.id, .asc),
    );
}

pub fn @"POST /chat/:id/messages"(db: *fr.Session, id: u32, data: schema.ChatMessage) !schema.ChatMessage {
    const chat = try db.find(schema.Chat, id) orelse return error.NotFound;
    var new = data;
    new.chat_id = chat.id;

    return db.create(schema.ChatMessage, new);
}

pub fn @"GET /chat/:id/messages/:message_id"(db: *fr.Session, id: u32, message_id: u32) !schema.ChatMessage {
    return try db.findBy(schema.ChatMessage, .{
        .id = message_id,
        .chat_id = id,
    }) orelse error.NotFound;
}

pub fn @"PUT /chat/:id/messages/:message_id"(db: *fr.Session, id: u32, message_id: u32, data: schema.ChatMessage) !schema.ChatMessage {
    try db.update(schema.ChatMessage, message_id, data);

    return try db.findBy(schema.ChatMessage, .{
        .id = message_id,
        .chat_id = id,
    }) orelse return error.NotFound;
}

pub fn @"DELETE /chat/:id/messages/:message_id"(db: *fr.Session, id: u32, message_id: u32) !void {
    try db.exec(
        fr.delete(schema.ChatMessage).where(.{ .id = message_id, .chat_id = id }),
    );
}

pub fn @"DELETE /chat/:id"(db: *fr.Session, id: u32) !void {
    try db.delete(schema.Chat, id);
}
