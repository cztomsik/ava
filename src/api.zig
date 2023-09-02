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

        var cx = try llama.Pool.get(try registry.getModelPath(ctx.arena, params.model));
        defer llama.Pool.release(cx);

        try cx.prepare(params.prompt);

        // multi-byte
        // TODO: move to Sampler?
        var mb_pending: usize = 0;
        var buf = std.ArrayList(u8).init(ctx.arena);
        var writer = buf.writer();

        while (try cx.generate(&sampler)) |token| {
            const bytes = cx.model.token_to_str(token);

            if (mb_pending > 0) {
                mb_pending -= bytes.len;
                try writer.writeAll(bytes);
                continue;
            }

            if (buf.items.len > 0) {
                try ctx.sendChunk(buf.items);
                buf.clearRetainingCapacity();
                mb_pending = 0;
                continue;
            }

            if (bytes.len == 1) {
                mb_pending = try std.unicode.utf8ByteSequenceLength(bytes[0]) - 1;
            }

            if (mb_pending > 0) {
                try writer.writeAll(bytes);
                continue;
            }

            try ctx.sendChunk(bytes);
        }
        return;
    }

    return error.NotFound;
}
