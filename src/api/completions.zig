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

    // Copy-pasted from llama.SamplingParams
    seed: u32 = 0,
    top_k: u32 = 40,
    top_p: f32 = 0.5,
    temperature: f32 = 0.7,
    repeat_n_last: usize = 256,
    repeat_penalty: f32 = 1.05,
    presence_penalty: f32 = 0,
    frequency_penalty: f32 = 0,
    json: bool = false,
};

pub const Completion = struct {
    id: []const u8,
    choices: [1]struct {
        finish_reason: FinishReason,
        index: u32 = 0,
        message: Message,
    },
    created: i64,
    model: []const u8,
    system_fingerprint: []const u8 = "fp_xxx",
    object: []const u8 = "chat.completion",
    usage: Usage,
};

pub const CompletionChunk = struct {
    id: []const u8,
    choices: [1]struct {
        finish_reason: ?FinishReason = null,
        index: u32 = 0,
        delta: struct {
            content: ?[]const u8 = null,
        } = .{},
    },
    created: i64,
    model: []const u8,
    object: []const u8 = "chat.completion.chunk",
    usage: ?Usage = null,
};

const FinishReason = enum { length, stop };

const Usage = struct {
    prompt_tokens: usize,
    completion_tokens: usize,
    total_tokens: usize,
};

pub fn @"POST /chat/completions"(db: *fr.Session, pool: *llama.Pool, params: Params) !CompletionOrStream {
    const model = try db.query(schema.Model).findBy(.name, params.model) orelse return error.NotFound;

    var cx = try pool.get(model.path, 60_000);
    errdefer pool.release(cx);

    const id = try std.fmt.allocPrint(db.arena, "chatcmpl-{}", .{std.time.timestamp()}); // TODO: should be random
    const prompt = params.prompt orelse try applyTemplate(db.arena, cx.model, params.messages);

    try cx.prepare(prompt, .{
        .seed = params.seed,
        .top_k = params.top_k,
        .top_p = params.top_p,
        .temperature = params.temperature,
        .repeat_n_last = params.repeat_n_last,
        .repeat_penalty = params.repeat_penalty,
        .presence_penalty = params.presence_penalty,
        .frequency_penalty = params.frequency_penalty,
        .json = params.json,
    });

    return .{
        .pool = pool,
        .cx = cx,
        .params = params,
        .id = id,
    };
}

const CompletionOrStream = struct {
    pool: *llama.Pool,
    cx: *llama.Context,
    params: Params,
    id: []const u8,

    pub const jsonSchema = tk.Schema.forType(Completion);

    pub fn sendResponse(self: @This(), ctx: *tk.Context) !void {
        var stream = CompletionStream{
            .pool = self.pool,
            .cx = self.cx,
            .id = self.id,
            .model = self.params.model,
            .prompt_tokens = self.cx.tokens.items.len,
            .max_tokens = self.params.max_tokens,
        };

        if (self.params.stream) {
            return ctx.send(tk.EventStream(CompletionStream){ .impl = stream });
        } else {
            defer stream.deinit();

            while (try stream.next()) |chunk| {
                if (chunk.choices[0].finish_reason) |r| {
                    try ctx.send(Completion{
                        .id = chunk.id,
                        .choices = .{.{
                            .finish_reason = r,
                            .message = .{
                                .role = "assistant",
                                .content = stream.cx.buf.items,
                            },
                        }},
                        .created = std.time.timestamp(),
                        .model = chunk.model,
                        .usage = chunk.usage.?,
                    });
                }
            }
        }
    }
};

const CompletionStream = struct {
    pool: *llama.Pool,
    cx: *llama.Context,
    id: []const u8,
    model: []const u8,
    prompt_tokens: usize,
    max_tokens: u32,
    tokens: usize = 0,
    finish_reason: ?FinishReason = null,

    pub fn deinit(self: *CompletionStream) void {
        self.pool.release(self.cx);
    }

    pub fn next(self: *CompletionStream) !?CompletionChunk {
        if (self.finish_reason != null) {
            return null;
        }

        if (self.tokens >= self.max_tokens) {
            self.finish_reason = .length;
        } else if (try self.cx.generate()) |chunk| {
            self.tokens += 1;

            return .{
                .id = self.id,
                .choices = .{.{
                    .delta = .{
                        .content = chunk,
                    },
                }},
                .created = std.time.timestamp(),
                .model = self.model,
            };
        } else {
            self.finish_reason = .stop;
        }

        return .{
            .id = self.id,
            .choices = .{.{
                .finish_reason = self.finish_reason.?,
            }},
            .created = std.time.timestamp(),
            .model = self.model,
            .usage = .{
                .prompt_tokens = self.prompt_tokens,
                .completion_tokens = self.tokens,
                .total_tokens = self.prompt_tokens + self.tokens,
            },
        };
    }
};

fn applyTemplate(allocator: std.mem.Allocator, model: *llama.Model, messages: []const Message) ![]const u8 {
    const chat = try allocator.alloc(llama.c.llama_chat_message, messages.len);
    for (messages, 0..) |msg, i| {
        chat[i].role = try allocator.dupeZ(u8, msg.role);
        chat[i].content = try allocator.dupeZ(u8, msg.content);
    }

    const tpl = llama.c.llama_model_chat_template(model.ptr, null);
    const len = llama.c.llama_chat_apply_template(tpl, chat.ptr, chat.len, true, null, 0);
    const res = try allocator.allocSentinel(u8, @intCast(len), 0);
    _ = llama.c.llama_chat_apply_template(tpl, chat.ptr, @intCast(chat.len), true, res.ptr, @intCast(res.len + 1));
    return res;
}
