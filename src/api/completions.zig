const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const schema = @import("../schema.zig");
const llama = @import("../llama.zig");

pub const Message = struct {
    role: []const u8,
    content: []const u8,
};

pub const Params = struct {
    stream: bool = false,
    model: []const u8,
    prompt: ?[]const u8 = null, // legacy
    messages: []const Message = &.{},
    max_tokens: u32 = 2048,
    trim_first: bool = false,
    sampling: llama.SamplingParams = .{},
};

pub const Completion = struct {
    choices: [1]struct {
        index: u32 = 0,
        message: Message,
    },
};

pub fn @"POST /chat/completions"(allocator: std.mem.Allocator, db: *fr.Session, pool: *llama.Pool, res: *tk.Response, params: Params) !Completion {
    const model = try db.findBy(schema.Model, .{ .name = params.model }) orelse return error.NotFound;

    // TODO: refactor
    if (params.stream) {
        try res.setHeader("Content-Type", "application/jsonlines");
        try res.respond();
        try res.sendJson(.{ .status = "Waiting for the model..." });
    }

    var cx = try pool.get(model.path, 60_000);
    defer pool.release(cx);

    const prompt = params.prompt orelse try applyTemplate(allocator, cx.model, params.messages);
    defer allocator.free(prompt);

    if (params.stream) {
        try res.sendJson(.{ .status = "Reading the history..." });
    }

    try cx.prepare(prompt, &params.sampling);

    if (params.stream) {
        while (cx.n_past < cx.tokens.items.len) {
            try res.sendJson(.{ .status = try std.fmt.allocPrint(allocator, "Reading the history... ({}/{})", .{ cx.n_past, cx.tokens.items.len }) });
            _ = try cx.evalOnce();
        }

        // TODO: send enums/unions
        try res.sendJson(.{ .status = "" });
    }

    var buf = std.ArrayList(u8).init(allocator);
    errdefer buf.deinit();

    var tokens: u32 = 0;

    while (try cx.generate(&params.sampling)) |chunk| {
        try buf.appendSlice(chunk);

        if (params.stream) {
            try res.sendJson(.{
                .content = if (tokens == 0 and params.trim_first) std.mem.trimLeft(u8, buf.items, " \t\n\r") else buf.items,
            });
        }

        tokens += 1;
        if (tokens >= params.max_tokens) break;
    }

    return .{
        .choices = .{.{
            .message = .{
                .role = "assistant",
                .content = buf.items,
            },
        }},
    };
}

fn applyTemplate(allocator: std.mem.Allocator, model: *llama.Model, messages: []const Message) ![]const u8 {
    const chat = try allocator.alloc(llama.c.llama_chat_message, messages.len);
    for (messages, 0..) |msg, i| {
        chat[i].role = try allocator.dupeZ(u8, msg.role);
        chat[i].content = try allocator.dupeZ(u8, msg.content);
    }

    const len = llama.c.llama_chat_apply_template(model.ptr, null, chat.ptr, chat.len, true, null, 0);
    const res = try allocator.allocSentinel(u8, @intCast(len), 0);
    _ = llama.c.llama_chat_apply_template(model.ptr, null, chat.ptr, @intCast(chat.len), true, res.ptr, @intCast(res.len + 1));
    return res;
}
