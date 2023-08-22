const std = @import("std");
const builtin = @import("builtin");

const c = @cImport({
    @cInclude("llama.h");
});

pub const Token = c.llama_token;
pub const token_bos = c.llama_token_bos;
pub const token_eos = c.llama_token_eos;

pub fn init(allocator: std.mem.Allocator) void {
    c.llama_backend_init(false);
    Pool.init(allocator);
}

pub fn deinit() void {
    Pool.deinit();
    c.llama_backend_free();
}

/// A single-model, single-context, thread-safe pool.
pub const Pool = struct {
    var allocator: std.mem.Allocator = undefined;
    var mutex = std.Thread.Mutex{};
    var model: ?Model = null;
    var context: ?Context = null;

    /// Initializes the pool.
    pub fn init(ally: std.mem.Allocator) void {
        allocator = ally;
    }

    /// Deinitializes the pool.
    pub fn deinit() void {
        if (context != null) {
            context.?.deinit();
            context = null;

            model.?.deinit();
            model = null;
        }
    }

    /// Returns a context for the given model. The context must be released
    /// after use. This function is thread-safe. Fails if the context is already
    /// in use.
    pub fn get(model_path: []const u8) !*Context {
        if (!mutex.tryLock()) return error.ContextBusy;
        errdefer mutex.unlock();

        // Reset if the model has changed.
        if (model != null and !std.mem.eql(u8, model.?.path, model_path)) {
            context.?.deinit();
            context = null;

            model.?.deinit();
            model = null;
        }

        if (model == null) {
            model = try Model.loadFromFile(allocator, model_path);
            context = try Context.init(
                allocator,
                &model.?,
                4, // TODO: make this configurable (in global settings)
            );
        }

        return &context.?;
    }

    /// Releases the context so that it can be used by other threads.
    pub fn release(ctx: *Context) void {
        if (ctx == &context.?) {
            mutex.unlock();
        }
    }
};

pub const Model = struct {
    allocator: std.mem.Allocator,
    path: [:0]const u8,
    params: c.llama_context_params,
    ptr: *c.llama_model,

    /// Loads a model from a file.
    pub fn loadFromFile(allocator: std.mem.Allocator, model_path: []const u8) !Model {
        var params = c.llama_context_default_params();
        params.n_ctx = 2048; // TODO: make this configurable
        params.n_batch = 512; // TODO: @min(512, xxx)

        if (builtin.os.tag == .macos) {
            params.n_gpu_layers = 1;
        }

        var path = try allocator.dupeZ(u8, model_path);

        return .{
            .allocator = allocator,
            .path = path,
            .params = params,
            .ptr = c.llama_load_model_from_file(path.ptr, params) orelse return error.InvalidModel,
        };
    }

    /// Deinitializes the model.
    pub fn deinit(self: *Model) void {
        c.llama_free_model(self.ptr);
        self.allocator.free(self.path);
    }

    /// Returns a list of tokens for the given input.
    pub fn tokenize(self: *Model, allocator: std.mem.Allocator, input: []const u8, max_tokens: usize) !std.ArrayList(Token) {
        var tokens = try std.ArrayList(Token).initCapacity(allocator, max_tokens);
        errdefer tokens.deinit();

        var c_input = try allocator.dupeZ(u8, input);
        defer allocator.free(c_input);

        const n_tokens = c.llama_tokenize_with_model(
            self.ptr,
            c_input,
            tokens.items.ptr,
            @intCast(max_tokens),
            true,
        );

        if (n_tokens >= 0) {
            tokens.items.len = @intCast(n_tokens);
        } else {
            return error.FailedToTokenize;
        }

        return tokens;
    }

    /// Returns the string representation of the token.
    pub fn token_to_str(self: *Model, token: Token) []const u8 {
        return std.mem.span(c.llama_token_to_str_with_model(self.ptr, token));
    }
};

pub const Context = struct {
    model: *Model,
    ptr: *c.llama_context,
    tokens: std.ArrayList(Token),
    n_past: usize = 0,
    n_threads: usize,

    /// Initializes the context.
    pub fn init(allocator: std.mem.Allocator, model: *Model, n_threads: usize) !Context {
        return .{
            .model = model,
            .ptr = c.llama_new_context_with_model(model.ptr, model.params) orelse return error.UnexpectedError,
            .tokens = std.ArrayList(Token).init(allocator),
            .n_threads = n_threads,
        };
    }

    /// Deinitializes the context.
    pub fn deinit(self: *Context) void {
        c.llama_free(self.ptr);
        self.tokens.deinit();
    }

    /// Prepares the context for inference.
    pub fn prepare(self: *Context, prompt: []const u8) !void {
        const tokens = try self.model.tokenize(self.tokens.allocator, prompt, @intCast(c.llama_n_ctx(self.ptr)));

        // Find the common part and set n_past accordingly.
        var n_past: usize = 0;

        for (0..@min(self.tokens.items.len, tokens.items.len)) |i| {
            if (self.tokens.items[i] != tokens.items[i]) break;
            n_past = i;
        }

        std.log.debug("{} tokens, n_past = {}", .{ tokens.items.len, n_past });

        self.tokens.deinit();
        self.tokens = tokens;
        self.n_past = n_past;
    }

    /// Runs the inference.
    pub fn eval(self: *Context) !void {
        while (self.n_past < self.tokens.items.len) {
            const toks = self.tokens.items[self.n_past..];

            const n_eval = @min(
                @as(usize, @intCast(self.model.params.n_batch)),
                self.tokens.items.len - self.n_past,
            );

            if (c.llama_eval(
                self.ptr,
                toks.ptr,
                @intCast(n_eval),
                @intCast(self.n_past),
                @intCast(self.n_threads),
            ) != 0) {
                return error.FailedToEval;
            }

            self.n_past += n_eval;
        }
    }

    /// Generates a token using the given sampler and appends it to the context.
    pub fn generate(self: *Context, sampler: *Sampler) !?Token {
        if (self.tokens.items.len >= c.llama_n_ctx(self.ptr)) {
            // Truncate input if it's too long but keep some empty space for
            // new tokens.
            const cutoff: usize = @intCast(@divTrunc(c.llama_n_ctx(self.ptr), 2));
            for (self.tokens.items[cutoff..], 0..) |t, i| {
                self.tokens.items[i] = t;
            }
            self.tokens.items.len = cutoff;
            self.n_past = 0;

            std.log.debug("truncated input to {}", .{cutoff});
        }

        try self.eval();

        const token = try sampler.sample(self) orelse return null;
        try self.tokens.append(token);
        return token;
    }
};

pub const Sampler = struct {
    candidates: std.ArrayList(c.llama_token_data),
    params: Params,

    pub const Params = struct {
        top_k: u32 = 40,
        top_p: f32 = 0.5,
        temperature: f32 = 0.7,
        stop_eos: bool = true,
    };

    /// Initializes the sampler.
    pub fn init(allocator: std.mem.Allocator, params: Params) Sampler {
        return .{
            .candidates = std.ArrayList(c.llama_token_data).init(allocator),
            .params = params,
        };
    }

    /// Deinitializes the sampler.
    pub fn deinit(self: *Sampler) void {
        self.candidates.deinit();
    }

    /// Samples a token from the context.
    pub fn sample(self: *Sampler, ctx: *Context) !?Token {
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

        if (self.params.temperature <= 0) {
            return c.llama_sample_token_greedy(ctx.ptr, &candidates);
        }

        c.llama_sample_top_k(ctx.ptr, &candidates, @intCast(self.params.top_k), 1);
        c.llama_sample_top_p(ctx.ptr, &candidates, self.params.top_p, 1);
        c.llama_sample_temperature(ctx.ptr, &candidates, self.params.temperature);

        const res = c.llama_sample_token(ctx.ptr, &candidates);

        if (self.params.stop_eos and res == token_eos()) {
            return null;
        }

        return res;
    }
};
