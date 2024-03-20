const std = @import("std");
const fg = @import("fridge");
const schema = @import("../schema.zig");
const llama = @import("../llama.zig");

pub const Message = struct {
    role: []const u8,
    content: []const u8,
};

pub const Params = struct {
    model: []const u8,
    messages: []const Message,
    max_tokens: u32 = 2048,
    // temperature: f32,
};

pub const Completion = struct {
    choices: [1]struct {
        index: u32,
        message: Message,
    },
};

pub fn @"POST /chat/completions"(allocator: std.mem.Allocator, db: *fg.Session, pool: *llama.Pool, params: Params) !Completion {
    const model = try db.findBy(schema.Model, .{ .name = params.model }) orelse return error.NotFound;

    var cx = try pool.get(model.path, 60_000);
    defer pool.release(cx);

    const prompt = try serializePrompt(allocator, params.messages);
    defer allocator.free(prompt);

    // TODO: sampling params are only needed for json
    try cx.prepare(prompt, &.{});

    var res = std.ArrayList(u8).init(allocator);
    errdefer res.deinit();

    var tokens: u32 = 0;

    while (try cx.generate(&.{
        // .temperature = params.temperature,
    })) |chunk| {
        try res.appendSlice(chunk);

        tokens += 1;
        if (tokens >= params.max_tokens) break;
    }

    return .{
        .choices = .{.{
            .index = 0,
            .message = .{
                .role = "assistant",
                .content = try res.toOwnedSlice(),
            },
        }},
    };
}

fn serializePrompt(allocator: std.mem.Allocator, messages: []const Message) ![]const u8 {
    var buf = std.ArrayList(u8).init(allocator);
    errdefer buf.deinit();

    for (messages) |m| {
        try buf.appendSlice(m.role);
        try buf.appendSlice(":");
        try buf.appendSlice(m.content);
        try buf.appendSlice("\n");
    }

    return buf.toOwnedSlice();
}
