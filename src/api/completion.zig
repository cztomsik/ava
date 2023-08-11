const std = @import("std");
const server = @import("../server.zig");
const llama = @import("../llama.zig");

const Completion = struct {
    ctx: llama.Context,
    tokens: std.ArrayList(llama.Token),
    n_past: usize = 0,
    sampler: llama.Sampler,

    pub fn init(allocator: std.mem.Allocator, model: *llama.Model, prompt: []const u8) !Completion {
        var ctx = try llama.Context.init(model);

        return .{
            .ctx = ctx,
            .tokens = try ctx.tokenize(allocator, prompt),
            .sampler = llama.Sampler.init(allocator),
        };
    }

    pub fn deinit(self: *Completion) void {
        self.sampler.deinit();
        self.tokens.deinit();
        self.ctx.deinit();
    }

    pub fn next(self: *Completion) !?[]const u8 {
        try self.ctx.eval(self.tokens.items[self.n_past..], self.n_past, 4);

        const token = try self.sampler.sample(&self.ctx);

        if (token == llama.eos()) {
            return null;
        }

        // TODO: multi-byte tokens (sample more)

        self.n_past = self.tokens.items.len;
        try self.tokens.append(token);

        return self.ctx.token_to_str(token);
    }
};

pub fn handler(ctx: *server.Context) !void {
    var params = try ctx.readJson(struct {
        prompt: []const u8,
    });

    var model = try llama.Model.loadFromFile("/Users/cztomsik/Downloads/wizardlm-13b-v1.2.ggmlv3.q4_0.bin");
    defer model.deinit();

    var completion = try Completion.init(ctx.res.allocator, &model, params.prompt);
    defer completion.deinit();

    while (try completion.next()) |t| {
        try ctx.sendChunk(t);
    }
}
