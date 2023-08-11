const std = @import("std");
const builtin = @import("builtin");

const c = @cImport({
    @cInclude("llama.h");
});

pub const Token = c.llama_token;
pub const bos = c.llama_token_bos;
pub const eos = c.llama_token_eos;

pub fn init() void {
    c.llama_backend_init(false);
}

pub const Model = struct {
    ptr: *c.llama_model,

    /// Loads a model from a file.
    pub fn loadFromFile(path: [*:0]const u8) !Model {
        var params = c.llama_context_default_params();

        return .{
            .ptr = c.llama_load_model_from_file(path, params) orelse return error.InvalidModel,
        };
    }

    /// Deinitializes the model.
    pub fn deinit(self: *Model) void {
        c.llama_free_model(self.ptr);
    }
};

pub const Context = struct {
    ptr: *c.llama_context,

    pub fn init(model: *Model) !Context {
        var params = c.llama_context_default_params();
        params.n_ctx = 2048;

        if (builtin.os.tag == .macos) {
            params.n_gpu_layers = 1;
        }

        return .{
            .ptr = c.llama_new_context_with_model(model.ptr, params) orelse return error.UnexpectedError,
        };
    }

    /// Deinitializes the context.
    pub fn deinit(self: *Context) void {
        c.llama_free(self.ptr);
    }

    /// Returns a list of tokens for the given input.
    pub fn tokenize(self: *Context, allocator: std.mem.Allocator, input: []const u8) !std.ArrayList(Token) {
        var tokens = try std.ArrayList(Token).initCapacity(allocator, @intCast(c.llama_n_ctx(self.ptr)));
        errdefer tokens.deinit();

        var c_input = try allocator.dupeZ(u8, input);
        defer allocator.free(c_input);

        const n_tokens = c.llama_tokenize(self.ptr, c_input, tokens.items.ptr, @intCast(tokens.capacity), true);

        if (n_tokens >= 0) {
            tokens.items.len = @intCast(n_tokens);
        } else {
            return error.FailedToTokenize;
        }

        return tokens;
    }

    /// Runs the inference using `n_past` tokens as KV-cache.
    pub fn eval(self: *Context, tokens: []c.llama_token, n_past: usize, n_threads: usize) !void {
        if (c.llama_eval(self.ptr, tokens.ptr, @intCast(tokens.len), @intCast(n_past), @intCast(n_threads)) > 0) {
            return error.FailedToEval;
        }
    }

    /// Returns the string representation of the token.
    pub fn token_to_str(self: *Context, token: Token) []const u8 {
        return std.mem.span(c.llama_token_to_str(self.ptr, token));
    }
};

pub const Sampler = struct {
    candidates: std.ArrayList(c.llama_token_data),

    /// Initializes the sampler.
    pub fn init(allocator: std.mem.Allocator) Sampler {
        return .{
            .candidates = std.ArrayList(c.llama_token_data).init(allocator),
        };
    }

    /// Deinitializes the sampler.
    pub fn deinit(self: *Sampler) void {
        self.candidates.deinit();
    }

    /// Samples a token from the context.
    pub fn sample(self: *Sampler, ctx: *Context) !Token {
        const logits = c.llama_get_logits(ctx.ptr);
        try self.candidates.resize(@intCast(c.llama_n_vocab(ctx.ptr)));

        for (self.candidates.items, 0..) |*candidate, i| {
            candidate.* = .{
                .id = @intCast(i),
                .logit = logits[i],
                .p = 0,
            };
        }

        var candidates: c.llama_token_data_array = .{
            .data = self.candidates.items.ptr,
            .size = self.candidates.items.len,
            .sorted = false,
        };

        // if (self.temperature <= 0) {
        return c.llama_sample_token_greedy(ctx.ptr, &candidates);
        // }

        // c.llama_sample_top_k(ctx.ptr, &candidates, 40, 1);
        // c.llama_sample_top_p(ctx.ptr, &candidates, 0.5, 1);
        // c.llama_sample_temperature(ctx.ptr, &candidates, 0.7);

        // return c.llama_sample_token(ctx.ptr, &candidates);
    }
};
