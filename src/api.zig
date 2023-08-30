const std = @import("std");
const server = @import("server.zig");
const registry = @import("model_registry.zig");
const llama = @import("llama.zig");

pub fn handler(ctx: *server.Context) !void {
    ctx.path = ctx.path[4..];

    if (ctx.match("/models")) {
        const models = try registry.getModels(ctx.arena);
        return ctx.sendJson(models);
    }

    if (ctx.match("/generate")) {
        const params = try ctx.readJson(struct {
            model: []const u8,
            prompt: []const u8,
            sampling: llama.Sampler.Params = .{},
        });

        var sampler = llama.Sampler.init(ctx.arena, params.sampling);
        defer sampler.deinit();

        var cx = try llama.Pool.get(try registry.getModelPath(ctx.arena, params.model));
        defer llama.Pool.release(cx);

        try cx.prepare(params.prompt);

        while (try cx.generate(&sampler)) |token| {
            // TODO: multi-byte tokens (keep sampling)
            try ctx.sendChunk(cx.model.token_to_str(token));
        }
        return;
    }

    return error.NotFound;
}