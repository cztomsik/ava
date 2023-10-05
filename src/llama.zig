const std = @import("std");
const builtin = @import("builtin");
const log = std.log.scoped(.llama);

const c = @cImport({
    @cDefine("GGML_UNREACHABLE", "unreachable");
    @cInclude("llama.h");
});

pub const Token = c.llama_token;

pub const SamplingParams = struct {
    top_k: u32 = 40,
    top_p: f32 = 0.5,
    temperature: f32 = 0.7,
    repeat_n_last: usize = 256,
    repeat_penalty: f32 = 1.05,
    add_bos: bool = true,
    stop_eos: bool = true,
    stop: []const []const u8 = &.{},
};

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
    /// after use. This function is thread-safe. Fails if the context is busy
    /// for more than `timeout` milliseconds.
    pub fn get(model_path: []const u8, timeout: u64) !*Context {
        const start = std.time.milliTimestamp();

        while (!mutex.tryLock()) {
            if (std.time.milliTimestamp() - start > timeout) return error.ContextBusy;
            std.time.sleep(100_000_000);
        }
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
    params: c.llama_model_params,
    ptr: *c.llama_model,

    /// Loads a model from a file.
    pub fn loadFromFile(allocator: std.mem.Allocator, model_path: []const u8) !Model {
        var params = c.llama_model_default_params();
        const path = try allocator.dupeZ(u8, model_path);
        const ptr = c.llama_load_model_from_file(path.ptr, params) orelse return error.InvalidModel;

        if (builtin.os.tag == .macos) {
            // Metal does not support F32 yet
            var desc: [256:0]u8 = undefined;
            _ = c.llama_model_desc(ptr, &desc, desc.len);

            params.n_gpu_layers =
                // there are some issues with intel-based macs
                if (builtin.cpu.arch == .aarch64 and std.mem.indexOf(u8, &desc, "F32") == null) 1 else 0;
        }

        return .{
            .allocator = allocator,
            .path = path,
            .params = params,
            .ptr = ptr,
        };
    }

    /// Deinitializes the model.
    pub fn deinit(self: *Model) void {
        c.llama_free_model(self.ptr);
        self.allocator.free(self.path);
    }

    /// Returns a list of tokens for the given input.
    pub fn tokenize(self: *Model, allocator: std.mem.Allocator, input: []const u8, max_tokens: usize, add_bos: bool) !std.ArrayList(Token) {
        var tokens = try std.ArrayList(Token).initCapacity(allocator, max_tokens);
        errdefer tokens.deinit();

        const n_tokens = c.llama_tokenize(
            self.ptr,
            input.ptr,
            @intCast(input.len),
            tokens.items.ptr,
            @intCast(max_tokens),
            add_bos,
        );

        if (n_tokens >= 0) {
            tokens.items.len = @intCast(n_tokens);
        } else {
            return error.FailedToTokenize;
        }

        return tokens;
    }
};

pub const Context = struct {
    model: *Model,
    params: c.llama_context_params,
    ptr: *c.llama_context,
    tokens: std.ArrayList(Token),
    n_past: usize = 0,
    candidates: std.ArrayList(c.llama_token_data),
    buf: std.ArrayList(u8),

    /// Initializes the context.
    pub fn init(allocator: std.mem.Allocator, model: *Model, n_threads: usize) !Context {
        var params = c.llama_context_default_params();
        params.n_ctx = 2048; // TODO: make this configurable
        params.n_batch = 64; // 512; // TODO: @min(512, xxx)
        params.n_threads = @intCast(n_threads);

        return .{
            .model = model,
            .params = params,
            .ptr = c.llama_new_context_with_model(model.ptr, params) orelse return error.UnexpectedError,
            .tokens = std.ArrayList(Token).init(allocator),
            .candidates = std.ArrayList(c.llama_token_data).init(allocator),
            .buf = std.ArrayList(u8).init(allocator),
        };
    }

    /// Deinitializes the context.
    pub fn deinit(self: *Context) void {
        c.llama_free(self.ptr);
        self.tokens.deinit();
        self.candidates.deinit();
        self.buf.deinit();
    }

    /// Prepares the context for inference.
    pub fn prepare(self: *Context, prompt: []const u8, add_bos: bool) !void {
        const tokens = try self.model.tokenize(self.tokens.allocator, prompt, @intCast(c.llama_n_ctx(self.ptr)), add_bos);
        self.buf.shrinkRetainingCapacity(0);

        // Find the common part and set n_past accordingly.
        var n_past: usize = 0;

        for (0..@min(self.tokens.items.len, tokens.items.len)) |i| {
            if (self.tokens.items[i] != tokens.items[i]) break;
            n_past = i;
        }

        log.debug("{} tokens, n_past = {}", .{ tokens.items.len, n_past });

        self.tokens.deinit();
        self.tokens = tokens;
        self.n_past = n_past;
    }

    /// Runs the inference.
    /// Does nothing if the context is already up-to-date.
    pub fn eval(self: *Context) !void {
        while (try self.evalOnce() > 0) {}
    }

    /// Runs one step of inference.
    /// Does nothing if the context is already up-to-date.
    /// Returns the number of tokens evaluated.
    pub fn evalOnce(self: *Context) !usize {
        const n_eval = @min(
            @as(usize, @intCast(self.params.n_batch)),
            self.tokens.items.len - self.n_past,
        );

        if (n_eval > 0) {
            const toks = self.tokens.items[self.n_past..];

            if (c.llama_eval(
                self.ptr,
                toks.ptr,
                @intCast(n_eval),
                @intCast(self.n_past),
            ) != 0) {
                return error.FailedToEval;
            }

            self.n_past += n_eval;
        }

        return n_eval;
    }

    /// Generates next utf-8 valid chunk of text.
    pub fn generate(self: *Context, params: *const SamplingParams) !?[]const u8 {
        const token = try self.generateToken(params) orelse return null;
        const piece = std.mem.span(c.llama_token_get_text(self.ptr, token));
        const start = self.buf.items.len;

        switch (c.llama_token_get_type(self.ptr, token)) {
            c.LLAMA_TOKEN_TYPE_NORMAL => {
                // Replace \xe2\x96\x81 (Lower One Eighth Block) with space
                if (c.llama_vocab_type(self.model.ptr) == c.LLAMA_VOCAB_TYPE_SPM) {
                    try self.buf.ensureUnusedCapacity(piece.len);
                    self.buf.items.len += piece.len;
                    self.buf.items.len -= std.mem.replace(u8, piece, "▁", " ", self.buf.items[start..]) * 2;
                } else {
                    try self.buf.appendSlice(piece);
                }
            },
            c.LLAMA_TOKEN_TYPE_UNKNOWN => try self.buf.appendSlice("▅"),
            c.LLAMA_TOKEN_TYPE_BYTE => try self.buf.append(try std.fmt.parseInt(u8, piece[3..5], 16)),
            else => {},
        }

        // Keep generating until we have valid chunk, but not more than 32 times.
        for (0..32) |_| {
            if (std.unicode.utf8ValidateSlice(self.buf.items[start..])) {
                const chunk = self.buf.items[start..];

                for (params.stop) |s| {
                    // Stop if the chunk contains the stop suffix.
                    if (std.mem.indexOf(u8, chunk, s) != null) {
                        return null;
                    }

                    // Current chunk might be a start of the stop suffix, so let's generate one more token.
                    if (std.mem.startsWith(u8, s, chunk)) {
                        break;
                    }
                } else return chunk;
            }

            // Generate next token or stop if we can't.
            if (try self.generate(params) == null) break;
        }

        // Discard the invalid chunk.
        self.buf.shrinkRetainingCapacity(start);
        return null;
    }

    /// Generates a token using the given sampler and appends it to the context.
    pub fn generateToken(self: *Context, params: *const SamplingParams) !?Token {
        if (self.tokens.items.len >= c.llama_n_ctx(self.ptr)) {
            // Truncate input if it's too long but keep some empty space for
            // new tokens.
            const cutoff: usize = @intCast(@divTrunc(c.llama_n_ctx(self.ptr), 2));
            for (self.tokens.items[cutoff..], 0..) |t, i| {
                self.tokens.items[i] = t;
            }
            self.tokens.items.len = cutoff;
            self.n_past = 0;

            log.debug("truncated input to {}", .{cutoff});
        }

        try self.eval();

        const token = try self.sampleToken(params) orelse return null;
        try self.tokens.append(token);
        return token;
    }

    /// Samples a token from the context.
    pub fn sampleToken(self: *Context, params: *const SamplingParams) !?Token {
        const logits = c.llama_get_logits(self.ptr);
        try self.candidates.resize(@intCast(c.llama_n_vocab(self.model.ptr)));

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

        // Apply repetition penalty.
        const last_n = @min(self.tokens.items.len, params.repeat_n_last);
        c.llama_sample_repetition_penalty(self.ptr, &candidates, &self.tokens.items[self.tokens.items.len - last_n], @intCast(last_n), params.repeat_penalty);

        if (params.temperature <= 0) {
            return c.llama_sample_token_greedy(self.ptr, &candidates);
        }

        c.llama_sample_top_k(self.ptr, &candidates, @intCast(params.top_k), 1);
        c.llama_sample_top_p(self.ptr, &candidates, params.top_p, 1);
        c.llama_sample_temperature(self.ptr, &candidates, params.temperature);

        const res = c.llama_sample_token(self.ptr, &candidates);

        if (params.stop_eos and res == c.llama_token_eos(self.ptr)) {
            return null;
        }

        return res;
    }
};
