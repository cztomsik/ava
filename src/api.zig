const std = @import("std");
const server = @import("server.zig");
const db = @import("db.zig");
const registry = @import("model_registry.zig");
const llama = @import("llama.zig");

pub fn @"GET /models"(ctx: *server.Context) !void {
    const models = try registry.getModels(ctx.arena);
    return ctx.sendJson(models);
}

pub fn @"DELETE /models/:id"(ctx: *server.Context, id: []const u8) !void {
    try registry.deleteModel(ctx.arena, id);
    return ctx.noContent();
}

pub fn @"POST /generate"(ctx: *server.Context) !void {
    const params = try ctx.readJson(struct {
        model: []const u8,
        prompt: []const u8,
        sampling: llama.SamplingParams = .{},
    });

    try ctx.sendJson(.{ .status = "Waiting for the model..." });
    var cx = llama.Pool.get(try registry.getModelPath(ctx.arena, params.model), 30_000) catch |e| {
        return ctx.sendJson(.{ .@"error" = @errorName(e) });
    };
    defer llama.Pool.release(cx);

    try ctx.sendJson(.{ .status = "Reading the history..." });
    try cx.prepare(params.prompt);

    while (try cx.generate(&params.sampling)) |content| {
        try ctx.sendJson(.{ .content = content });
    }
}

pub fn @"GET /chat"(ctx: *server.Context) !void {
    var stmt = try db.query("SELECT * FROM Chat ORDER BY id", .{});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(db.Chat));
}

pub fn @"POST /chat"(ctx: *server.Context) !void {
    const data = try ctx.readJson(struct {
        name: []const u8,
    });

    var stmt = try db.query("INSERT INTO Chat (name) VALUES (?) RETURNING *", .{data.name});
    defer stmt.deinit();

    try ctx.sendJson(try stmt.read(db.Chat));
}

pub fn @"GET /chat/:id"(ctx: *server.Context, id: u32) !void {
    var stmt = try db.query("SELECT * FROM Chat WHERE id = ?", .{id});
    defer stmt.deinit();

    return ctx.sendJson(try stmt.read(db.Chat));
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

pub fn @"PUT /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    const data = try ctx.readJson(struct {
        role: []const u8,
        content: []const u8,
    });

    try db.exec("UPDATE ChatMessage SET role = ?, content = ? WHERE id = ? AND chat_id = ?", .{ data.role, data.content, message_id, id });
}

pub fn @"DELETE /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    try db.exec("DELETE FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
    return ctx.noContent();
}

pub fn @"GET /prompts"(ctx: *server.Context) !void {
    var stmt = try db.query("SELECT * FROM Prompt ORDER BY id", .{});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(db.Prompt));
}

pub fn @"POST /prompts"(ctx: *server.Context) !void {
    const data = try ctx.readJson(struct {
        name: []const u8,
        prompt: []const u8,
    });

    var stmt = try db.query("INSERT INTO Prompt (name, prompt) VALUES (?, ?) RETURNING *", .{ data.name, data.prompt });
    defer stmt.deinit();

    try ctx.sendJson(try stmt.read(db.Prompt));
}

pub fn @"DELETE /prompts/:id"(ctx: *server.Context, id: u32) !void {
    try db.exec("DELETE FROM Prompt WHERE id = ?", .{id});
    return ctx.noContent();
}
