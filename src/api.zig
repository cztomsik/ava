const std = @import("std");
const server = @import("server.zig");
const registry = @import("model_registry.zig");
const llama = @import("llama.zig");

pub fn handler(ctx: *server.Context) !void {
    const path = ctx.path[5..];

    if (std.mem.eql(u8, path, "models")) {
        const models = try registry.getModels(ctx.arena);
        try ctx.sendJson(models);
    }

    if (std.mem.eql(u8, path, "completion")) {
        const params = try ctx.readJson(struct {
            model: []const u8,
            prompt: []const u8,
            sampling: llama.Sampler.Params = .{},
        });

        var sampler = llama.Sampler.init(ctx.arena, params.sampling);
        defer sampler.deinit();

        var cx = try llama.Pool.get(params.model);
        defer llama.Pool.release(cx);

        try cx.prepare(params.prompt);

        while (try cx.generate(&sampler)) |token| {
            // TODO: multi-byte tokens (keep sampling)
            try ctx.sendChunk(cx.model.token_to_str(token));
        }
    }

    return error.NotFound;
}
