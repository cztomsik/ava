const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const schema = @import("../schema.zig");

pub fn @"GET /chat"(db: *fr.Session) ![]const schema.ChatWithLastMessage {
    return db.query(schema.ChatWithLastMessage).orderBy(.id, .desc).findAll();
}

pub fn @"POST /chat"(db: *fr.Session, data: schema.Chat) !schema.Chat {
    return db.create(schema.Chat, data);
}

pub fn @"GET /chat/:id"(db: *fr.Session, id: u32) !schema.Chat {
    return try db.find(schema.Chat, id) orelse error.NotFound;
}

pub fn @"PUT /chat/:id"(db: *fr.Session, id: u32, data: schema.Chat) !void {
    try db.update(schema.Chat, id, data);
}

pub fn @"GET /chat/:id/messages"(db: *fr.Session, id: u32) ![]const schema.ChatMessage {
    return db.query(schema.ChatMessage).where("chat_id", id).orderBy(.id, .asc).findAll();
}

pub fn @"POST /chat/:id/messages"(db: *fr.Session, id: u32, data: schema.ChatMessage) !schema.ChatMessage {
    const chat = try db.find(schema.Chat, id) orelse return error.NotFound;
    var new = data;
    new.chat_id = chat.id;

    return db.create(schema.ChatMessage, new);
}

pub fn @"GET /chat/:id/messages/:message_id"(db: *fr.Session, id: u32, message_id: u32) !schema.ChatMessage {
    return try db.query(schema.ChatMessage)
        .where("chat_id", id)
        .findBy("id", message_id) orelse error.NotFound;
}

pub fn @"PUT /chat/:id/messages/:message_id"(db: *fr.Session, id: u32, message_id: u32, data: schema.ChatMessage) !void {
    return try db.query(schema.ChatMessage)
        .where("chat_id", id)
        .where("id", message_id)
        .update(data)
        .exec();
}

pub fn @"DELETE /chat/:id/messages/:message_id"(db: *fr.Session, id: u32, message_id: u32) !void {
    return try db.query(schema.ChatMessage)
        .where("chat_id", id)
        .where("id", message_id)
        .delete()
        .exec();
}

pub fn @"DELETE /chat/:id"(db: *fr.Session, id: u32) !void {
    try db.delete(schema.Chat, id);
}
