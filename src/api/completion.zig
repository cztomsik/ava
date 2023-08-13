const std = @import("std");
const server = @import("../server.zig");
const llama = @import("../llama.zig");

pub fn handler(ctx: *server.Context) !void {
    var params = try ctx.readJson(struct {
        model: []const u8,
        prompt: []const u8,
        sampling: llama.Sampler.Params = .{},
    });

    var sampler = llama.Sampler.init(ctx.res.allocator, params.sampling);
    defer sampler.deinit();

    var cx = try llama.Pool.get(params.model);
    defer llama.Pool.release(cx);

    try cx.prepare(params.prompt);

    while (try cx.generate(&sampler)) |token| {
        // TODO: multi-byte tokens (keep sampling)
        try ctx.sendChunk(cx.model.token_to_str(token));
    }
}
