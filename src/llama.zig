const std = @import("std");
const builtin = @import("builtin");
const log = std.log.scoped(.llama);

pub const c = @cImport({
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
    presence_penalty: f32 = 0,
    freq_penalty: f32 = 0,
    add_bos: bool = true,
    stop_eos: bool = true, // TODO: remove (db migration)
    stop: []const []const u8 = &.{},
    json: bool = false,
};

pub const PoolOptions = struct {
    n_gpu_layers: ?u32 = null,
    n_ctx: u32 = 2048,
    n_batch: u32 = 64,
    n_threads: ?u32 = null,
    n_threads_batch: ?u32 = null,
    flash_attn: bool = false,
    mlock: bool = false,
};

/// A single-model, single-context, thread-safe pool.
pub const Pool = struct {
    allocator: std.mem.Allocator = undefined,
    options: PoolOptions,
    mutex: std.Thread.Mutex = .{},
    model: ?Model = null,
    context: ?Context = null,

    /// Initializes the pool.
    pub fn init(allocator: std.mem.Allocator, options: PoolOptions) Pool {
        const H = struct {
            fn trampoline(_: c.enum_ggml_log_level, data: [*c]const u8, _: ?*anyopaque) callconv(.C) void {
                log.debug("{s}", .{std.mem.trimRight(u8, std.mem.span(data), &.{'\n'})});
            }
        };

        c.llama_backend_init();
        c.llama_log_set(H.trampoline, null);

        return .{
            .allocator = allocator,
            .options = options,
        };
    }

    /// Deinitializes the pool.
    pub fn deinit(self: *Pool) void {
        self.reset(undefined);
        c.llama_backend_free();
    }

    /// Resets the pool.
    pub fn reset(self: *Pool, options: PoolOptions) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.context) |*context| {
            context.deinit();
            self.context = null;
        }

        if (self.model) |*model| {
            model.deinit();
            self.model = null;
        }

        self.options = options;
    }

    /// Returns a context for the given model. The context must be released
    /// after use. This function is thread-safe. Fails if the context is busy
    /// for more than `timeout` milliseconds.
    pub fn get(self: *Pool, model_path: []const u8, timeout: u64) !*Context {
        const start = std.time.milliTimestamp();

        while (!self.mutex.tryLock()) {
            if (std.time.milliTimestamp() - start > timeout) return error.ContextBusy;
            std.time.sleep(100_000_000);
        }
        errdefer self.mutex.unlock();

        if (self.model == null or !std.mem.eql(u8, self.model.?.path, model_path)) {
            // Reset if the model has changed.
            if (self.context != null) {
                self.context.?.deinit();
                self.model.?.deinit();
            }

            self.model = try Model.loadFromFile(self.allocator, model_path, self.modelParams());
            self.context = try Context.init(self.allocator, &self.model.?, self.contextParams());
        }

        return &self.context.?;
    }

    fn modelParams(self: *Pool) c.llama_model_params {
        var params = c.llama_model_default_params();

        // It seems Metal never worked on Intel-based macs.
        // see https://github.com/ggerganov/llama.cpp/issues/3423#issuecomment-1745511586
        params.n_gpu_layers = @intCast(if (builtin.os.tag == .macos and builtin.cpu.arch == .aarch64) (self.options.n_gpu_layers orelse 999) else 0);
        params.use_mlock = self.options.mlock;

        return params;
    }

    fn contextParams(self: *Pool) c.llama_context_params {
        var params = c.llama_context_default_params();

        params.n_ctx = @intCast(self.options.n_ctx);
        params.n_batch = @intCast(self.options.n_batch);
        params.n_threads = @intCast(self.options.n_threads orelse getPerfCpuCount());
        params.n_threads_batch = @intCast(self.options.n_threads_batch orelse params.n_threads);
        params.flash_attn = self.options.flash_attn;

        return params;
    }

    /// Releases the context so that it can be used by other threads.
    pub fn release(self: *Pool, ctx: *Context) void {
        if (ctx == &self.context.?) {
            self.mutex.unlock();
        }
    }
};

pub const Model = struct {
    allocator: std.mem.Allocator,
    path: []const u8,
    params: c.llama_model_params,
    ptr: *c.llama_model,

    /// Loads a model from a file.
    pub fn loadFromFile(allocator: std.mem.Allocator, path: []const u8, params: c.struct_llama_model_params) !Model {
        const pathZ = try getShortPath(allocator, path);
        defer allocator.free(pathZ);

        // Load the model
        const ptr = c.llama_load_model_from_file(pathZ.ptr, params) orelse return error.InvalidModel;

        return .{
            .allocator = allocator,
            .path = try allocator.dupe(u8, path), // save original, long path
            .params = params,
            .ptr = ptr,
        };
    }

    /// Deinitializes the model.
    pub fn deinit(self: *Model) void {
        c.llama_free_model(self.ptr);
        self.allocator.free(self.path);
    }

    /// Returns the number of metadata entries.
    pub fn metaCount(self: *const Model) usize {
        return @intCast(c.llama_model_meta_count(self.ptr));
    }

    /// Returns the metadata key at the given index.
    pub fn metaKey(self: *const Model, allocator: std.mem.Allocator, index: usize) !?[:0]const u8 {
        const len = c.llama_model_meta_key_by_index(self.ptr, @intCast(index), null, 0);

        if (len < 0) {
            return null;
        }

        const buf = try allocator.allocSentinel(u8, @intCast(len), 0);
        _ = c.llama_model_meta_key_by_index(self.ptr, @intCast(index), buf.ptr, buf.len + 1);
        return buf;
    }

    pub fn metaValue(self: *const Model, allocator: std.mem.Allocator, key: [:0]const u8) !?[:0]const u8 {
        const len = c.llama_model_meta_val_str(self.ptr, key.ptr, null, 0);

        if (len < 0) {
            return null;
        }

        const buf = try allocator.allocSentinel(u8, @intCast(len), 0);
        _ = c.llama_model_meta_val_str(self.ptr, key.ptr, buf.ptr, buf.len + 1);
        return buf;
    }

    /// Tokenizes the input and appends the tokens to the given list.
    pub fn tokenize(self: *const Model, tokens: *std.ArrayList(Token), input: []const u8, add_bos: bool, special: bool) !void {
        try tokens.ensureUnusedCapacity(input.len / 2);
        var slice: []Token = tokens.items[tokens.items.len..];
        slice.len = tokens.capacity - tokens.items.len;

        const n_tokens = c.llama_tokenize(
            self.ptr,
            input.ptr,
            @intCast(input.len),
            slice.ptr,
            @intCast(slice.len),
            add_bos,
            special,
        );

        if (n_tokens >= 0) {
            tokens.items.len += @intCast(n_tokens);
        } else {
            try tokens.ensureUnusedCapacity(@intCast(-n_tokens));
            return self.tokenize(tokens, input, add_bos, special);
        }
    }

    fn getShortPath(allocator: std.mem.Allocator, path: []const u8) ![:0]const u8 {
        // llama.cpp is using fopen() and it does not support UTF-8 paths on Windows
        // so what we need to do is to call GetShortPathName() to get the short path
        // and it should work
        if (comptime builtin.os.tag == .windows) {
            const w = struct {
                extern "kernel32" fn GetShortPathNameW(lpszLongPath: ?[*:0]const u16, lpszShortPath: ?[*:0]u16, cchBuffer: u32) callconv(std.os.windows.WINAPI) u32;
            };

            const wpath = try std.unicode.utf8ToUtf16LeWithNull(allocator, path);
            defer allocator.free(wpath);

            var buf: [260:0]u16 = undefined;
            _ = w.GetShortPathNameW(wpath, &buf, buf.len);

            return std.unicode.utf16leToUtf8AllocZ(allocator, &buf);
        }

        return allocator.dupeZ(u8, path);
    }
};

pub const Context = struct {
    model: *Model,
    params: c.llama_context_params,
    ptr: *c.llama_context,
    grammar: ?*c.llama_grammar = null,
    tokens: std.ArrayList(Token),
    n_past: usize = 0,
    candidates: std.ArrayList(c.llama_token_data),
    buf: std.ArrayList(u8),

    /// Initializes the context.
    pub fn init(allocator: std.mem.Allocator, model: *Model, params: c.struct_llama_context_params) !Context {
        var candidates = std.ArrayList(c.llama_token_data).init(allocator);
        errdefer candidates.deinit();

        try candidates.resize(@intCast(c.llama_n_vocab(model.ptr)));

        return .{
            .model = model,
            .params = params,
            .ptr = c.llama_new_context_with_model(model.ptr, params) orelse return error.UnexpectedError,
            .tokens = std.ArrayList(Token).init(allocator),
            .candidates = candidates,
            .buf = std.ArrayList(u8).init(allocator),
        };
    }

    /// Deinitializes the context.
    pub fn deinit(self: *Context) void {
        if (self.grammar) |g| {
            c.llama_grammar_free(g);
        }

        c.llama_free(self.ptr);
        self.tokens.deinit();
        self.candidates.deinit();
        self.buf.deinit();
    }

    /// Prepares the context for inference.
    pub fn prepare(self: *Context, prompt: []const u8, params: *const SamplingParams) !void {
        var tokens = std.ArrayList(Token).init(self.model.allocator);
        errdefer tokens.deinit();

        try self.model.tokenize(&tokens, prompt, params.add_bos, true);
        self.buf.shrinkRetainingCapacity(0);

        // Find the common part and set n_past accordingly.
        var n_past: usize = 0;

        for (0..@min(self.tokens.items.len, tokens.items.len)) |i| {
            if (self.tokens.items[i] != tokens.items[i]) break;
            n_past = i;
        }

        // Remove the past tokens from the KV cache.
        if (!c.llama_kv_cache_seq_rm(self.ptr, 0, @intCast(n_past), -1)) {
            _ = c.llama_kv_cache_clear(self.ptr);
        }

        if (self.grammar) |g| {
            c.llama_grammar_free(g);
            self.grammar = null;
        }

        if (params.json) {
            self.grammar = c.llama_grammar_init(@constCast(grammar.JSON_RULES.ptr), grammar.JSON_RULES.len, 0);
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

            if (c.llama_decode(self.ptr, c.llama_batch_get_one(
                toks.ptr,
                @intCast(n_eval),
                @intCast(self.n_past),
                0,
            )) != 0) {
                return error.FailedToEval;
            }

            self.n_past += n_eval;
        }

        return n_eval;
    }

    /// Generates next utf-8 valid chunk of text.
    pub fn generate(self: *Context, params: *const SamplingParams) !?[]const u8 {
        const start = self.buf.items.len;

        // Keep generating until we have valid chunk, but not more than 32 times.
        outer: for (0..32) |_| {
            const token = try self.generateToken(params) orelse return null;
            const piece = std.mem.span(c.llama_token_get_text(self.model.ptr, token));

            switch (c.llama_token_get_attr(self.model.ptr, token)) {
                c.LLAMA_TOKEN_ATTR_NORMAL => {
                    // Replace \xe2\x96\x81 (Lower One Eighth Block) with space
                    if (c.llama_vocab_type(self.model.ptr) == c.LLAMA_VOCAB_TYPE_SPM) {
                        const n = std.mem.replace(u8, piece, "▁", " ", try self.buf.addManyAsSlice(piece.len));
                        self.buf.items.len -= n * 2; // ▁ is 3 bytes, space is 1 byte, so we need to remove 2 bytes
                    } else if (c.llama_vocab_type(self.model.ptr) == c.LLAMA_VOCAB_TYPE_BPE) {
                        try appendBPE(&self.buf, piece);
                    } else {
                        try self.buf.appendSlice(piece);
                    }
                },
                c.LLAMA_TOKEN_ATTR_UNKNOWN => try self.buf.appendSlice("▅"),
                c.LLAMA_TOKEN_ATTR_BYTE => try self.buf.append(try std.fmt.parseInt(u8, piece[3..5], 16)),
                else => {},
            }

            const chunk = self.buf.items[start..];

            if (std.unicode.utf8ValidateSlice(chunk)) {
                // Handle stop tokens.
                for (params.stop) |s| {
                    // Stop if the chunk contains the stop suffix.
                    if (std.mem.indexOf(u8, chunk, s) != null) {
                        break :outer;
                    }

                    // Current chunk might be a start of the stop suffix, so let's generate one more token.
                    if (std.mem.startsWith(u8, s, chunk)) {
                        continue :outer;
                    }
                }

                return chunk;
            }
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

        if (self.grammar != null) {
            c.llama_sample_grammar(self.ptr, &candidates, self.grammar);
        }

        const last_n = @min(self.tokens.items.len, params.repeat_n_last);
        c.llama_sample_repetition_penalties(
            self.ptr,
            &candidates,
            &self.tokens.items[self.tokens.items.len - last_n],
            @intCast(last_n),
            params.repeat_penalty,
            params.presence_penalty,
            params.freq_penalty,
        );

        if (params.temperature >= 0) {
            c.llama_sample_top_k(self.ptr, &candidates, @intCast(params.top_k), 1);
            c.llama_sample_top_p(self.ptr, &candidates, params.top_p, 1);
            c.llama_sample_temp(self.ptr, &candidates, params.temperature);
        }

        const res = if (params.temperature >= 0) c.llama_sample_token(self.ptr, &candidates) else c.llama_sample_token_greedy(self.ptr, &candidates);

        if (self.grammar != null) {
            c.llama_grammar_accept_token(self.grammar, self.ptr, res);
        }

        if (c.llama_token_is_eog(self.model.ptr, res)) {
            return null;
        }

        return res;
    }

    /// Appends a BPE piece to the buffer.
    pub fn appendBPE(buf: *std.ArrayList(u8), piece: []const u8) !void {
        try buf.ensureUnusedCapacity(piece.len);
        var iter = (try std.unicode.Utf8View.init(piece)).iterator();

        while (iter.nextCodepoint()) |cp| {
            try buf.append(@intCast(switch (cp) {
                '!'...'~', '¡'...'¬', '®'...'ÿ' => cp,
                'Ā'...'Ġ' => cp - 256,
                'ġ'...'ł' => cp - 162,
                'Ń' => 173,
                else => {
                    log.debug("Invalid BPE? {s} cp: {}", .{ piece, cp });
                    continue;
                },
            }));
        }
    }
};

fn getPerfCpuCount() usize {
    if (builtin.os.tag == .macos) {
        var count: c_int = 0;
        var len: usize = @sizeOf(c_int);

        std.posix.sysctlbynameZ("hw.perflevel0.physicalcpu", &count, &len, null, 0) catch {};
        if (count > 0) return @intCast(count);
    }

    return std.Thread.getCpuCount() catch 4;
}

const grammar = struct {
    const JSON_RULES = rulePtrs(&.{
        &.{ ref(1), end(0) },
        &.{ ch('{'), ref(7), ref(11), ch('}'), end(0) }, // ref(7), end(0) },
        &.{ ref(1), alt(0), ref(3), alt(0), ref(4), alt(0), ref(5), alt(0), ref(6), ref(7), end(0) },
        &.{ ch('['), ref(7), ref(15), ch(']'), ref(7), end(0) },
        &.{ ch('"'), ref(18), ch('"'), ref(7), end(0) },
        &.{ ref(19), ref(25), ref(29), ref(7), end(0) },
        &.{ ch('t'), ch('r'), ch('u'), ch('e'), alt(0), ch('f'), ch('a'), ch('l'), ch('s'), ch('e'), alt(0), ch('n'), ch('u'), ch('l'), ch('l'), end(0) },
        &.{ ref(31), end(0) },
        &.{ ref(4), ch(':'), ref(7), ref(2), ref(10), end(0) },
        &.{ ch(','), ref(7), ref(4), ch(':'), ref(7), ref(2), end(0) },
        &.{ ref(9), ref(10), alt(0), end(0) },
        &.{ ref(8), alt(0), end(0) },
        &.{ ref(2), ref(14), end(0) },
        &.{ ch(','), ref(7), ref(2), end(0) },
        &.{ ref(13), ref(14), alt(0), end(0) },
        &.{ ref(12), alt(0), end(0) },
        &.{ chNot('"'), chAlt('\\'), alt(0), ch('\\'), ref(17), end(0) },
        &.{ ch('"'), chAlt('\\'), chAlt('/'), chAlt('b'), chAlt('f'), chAlt('n'), chAlt('r'), chAlt('t'), alt(0), ch('u'), ch('0'), chRnu('9'), chAlt('a'), chRnu('f'), chAlt('A'), chRnu('F'), ch('0'), chRnu('9'), chAlt('a'), chRnu('f'), chAlt('A'), chRnu('F'), ch('0'), chRnu('9'), chAlt('a'), chRnu('f'), chAlt('A'), chRnu('F'), ch('0'), chRnu('9'), chAlt('a'), chRnu('f'), chAlt('A'), chRnu('F'), end(0) },
        &.{ ref(16), ref(18), alt(0), end(0) },
        &.{ ref(20), ref(21), end(0) },
        &.{ ch('-'), alt(0), end(0) },
        &.{ ch('0'), chRnu('9'), alt(0), ch('1'), chRnu('9'), ref(22), end(0) },
        &.{ ch('0'), chRnu('9'), ref(22), alt(0), end(0) },
        &.{ ch('.'), ref(24), end(0) },
        &.{ ch('0'), chRnu('9'), ref(24), alt(0), ch('0'), chRnu('9'), end(0) },
        &.{ ref(23), alt(0), end(0) },
        &.{ ch('e'), chAlt('E'), ref(27), ref(28), end(0) },
        &.{ ch('-'), chAlt('+'), alt(0), end(0) },
        &.{ ch('0'), chRnu('9'), ref(28), alt(0), ch('0'), chRnu('9'), end(0) },
        &.{ ref(26), alt(0), end(0) },
        &.{ ch(' '), chAlt('\u{0009}'), chAlt('\u{000A}'), ref(7), end(0) },
        &.{ ref(30), alt(0), end(0) },
    });

    fn rulePtrs(comptime rules: []const []const c.llama_grammar_element) []const [*c]const c.llama_grammar_element {
        var ptrs: [rules.len][*]const c.llama_grammar_element = undefined;
        for (rules, 0..) |rule, i| ptrs[i] = rule.ptr;
        const res = ptrs;
        return &res;
    }

    fn ref(i: usize) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_RULE_REF, .value = @intCast(i) };
    }

    fn end(i: usize) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_END, .value = @intCast(i) };
    }

    fn ch(v: u8) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_CHAR, .value = @intCast(v) };
    }

    fn chNot(v: u8) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_CHAR_NOT, .value = @intCast(v) };
    }

    fn chAlt(v: u8) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_CHAR_ALT, .value = @intCast(v) };
    }

    fn chRnu(v: u8) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_CHAR_RNG_UPPER, .value = @intCast(v) };
    }

    fn alt(i: usize) c.llama_grammar_element {
        return .{ .type = c.LLAMA_GRETYPE_ALT, .value = @intCast(i) };
    }
};
