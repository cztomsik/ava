const std = @import("std");
const server = @import("server.zig");
const db = @import("db.zig");
const registry = @import("model_registry.zig");
const llama = @import("llama.zig");

pub fn handler(ctx: *server.Context) !void {
    ctx.path = ctx.path[4..];

    if (ctx.match("/prompts")) {
        var stmt = try db.query("SELECT * FROM Prompt ORDER BY id", .{});
        defer stmt.deinit();

        return ctx.sendJson(stmt.iterator(db.Prompt));
    }

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

        try ctx.sendJson(.{ .status = "Waiting for the model..." });
        var cx = try llama.Pool.get(try registry.getModelPath(ctx.arena, params.model));
        defer llama.Pool.release(cx);

        try ctx.sendJson(.{ .status = "Reading the history..." });
        try cx.prepare(params.prompt);

        // Multi-byte, TODO: move to Sampler?
        var buf = std.ArrayList(u8).init(ctx.arena);

        // TODO: sometimes the model gets stuck with token 23 - maybe repetition penalty could help?
        while (try cx.generate(&sampler)) |token| {
            try buf.appendSlice(cx.model.token_to_str(token));

            if (std.unicode.utf8ValidateSlice(buf.items)) {
                try ctx.sendJson(.{ .content = buf.items });
                buf.clearRetainingCapacity();
            }
        }

        return;
    }

    return error.NotFound;
}
