const std = @import("std");
const server = @import("server.zig");
const db = @import("db.zig");
const registry = @import("model_registry.zig");
const llama = @import("llama.zig");

pub fn @"GET /models"(ctx: *server.Context) !void {
    const models = try registry.getModels(ctx.arena);
    return ctx.sendJson(models);
}

pub fn @"POST /generate"(ctx: *server.Context) !void {
    const params = try ctx.readJson(struct {
        model: []const u8,
        prompt: []const u8,
        sampling: llama.Sampler.Params = .{},
    });

    var sampler = llama.Sampler.init(ctx.arena, params.sampling);
    defer sampler.deinit();

    try ctx.sendJson(.{ .status = "Waiting for the model..." });
    var cx = try llama.Pool.get(try registry.getModelPath(ctx.arena, params.model));
    defer llama.Pool.release(cx);

    try ctx.sendJson(.{ .status = "Reading the history..." });
    try cx.prepare(params.prompt);

    // Multi-byte, TODO: move to Sampler?
    var buf = std.ArrayList(u8).init(ctx.arena);

    // TODO: sometimes the model gets stuck with token 23 - maybe repetition penalty could help?
    while (try cx.generate(&sampler)) |token| {
        try buf.appendSlice(cx.model.token_to_str(token));

        if (std.unicode.utf8ValidateSlice(buf.items)) {
            try ctx.sendJson(.{ .content = buf.items });
            buf.clearRetainingCapacity();
        }
    }
}

pub fn @"GET /chat"(ctx: *server.Context) !void {
    var stmt = try db.query("SELECT * FROM Chat ORDER BY id", .{});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(db.Chat));
}

pub fn @"GET /chat/:id/messages"(ctx: *server.Context, id: u32) !void {
    var stmt = try db.query("SELECT * FROM ChatMessage WHERE chat_id = ? ORDER BY id", .{id});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(db.ChatMessage));
}

pub fn @"POST /chat/:id/messages"(ctx: *server.Context, id: u32) !void {
    const data = try ctx.readJson(struct {
        prev_id: ?u32,
        role: []const u8,
        content: []const u8,
    });

    try db.exec("INSERT INTO ChatMessage (chat_id, prev_id, role, content) VALUES (?, ?, ?, ?)", .{ id, data.prev_id, data.role, data.content });
}

pub fn @"PUT /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    const data = try ctx.readJson(struct {
        role: []const u8,
        content: []const u8,
    });

    try db.exec("UPDATE ChatMessage SET role = ?, content = ? WHERE id = ? AND chat_id = ?", .{ data.role, data.content, message_id, id });
}

pub fn @"DELETE /chat/:id/messages/:message_id"(ctx: *server.Context, id: u32, message_id: u32) !void {
    _ = ctx;
    try db.exec("DELETE FROM ChatMessage WHERE id = ? AND chat_id = ?", .{ message_id, id });
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

    try db.exec("INSERT INTO Prompt (name, prompt) VALUES (?, ?)", .{ data.name, data.prompt });
}

pub fn @"DELETE /prompts/:id"(ctx: *server.Context, id: u32) !void {
    _ = ctx;
    try db.exec("DELETE FROM Prompt WHERE id = ?", .{id});
}
