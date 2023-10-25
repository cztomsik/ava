const std = @import("std");
const server = @import("../server.zig");
const db = @import("../db.zig");
const llama = @import("../llama.zig");

pub fn @"POST /generate"(ctx: *server.Context) !void {
    const params = try ctx.readJson(struct {
        model_id: u32,
        prompt: []const u8,
        sampling: llama.SamplingParams = .{},
    });

    try ctx.sendJson(.{ .status = "Waiting for the model..." });
    var model_path = try db.getString(ctx.arena, "SELECT path FROM Model WHERE id = ?", .{params.model_id});
    var cx = try llama.Pool.get(model_path, 60_000);
    defer llama.Pool.release(cx);

    try ctx.sendJson(.{ .status = "Reading the history..." });
    try cx.prepare(params.prompt, params.sampling.add_bos);

    while (cx.n_past < cx.tokens.items.len) {
        try ctx.sendJson(.{ .status = try std.fmt.allocPrint(ctx.arena, "Reading the history... ({}/{})", .{ cx.n_past, cx.tokens.items.len }) });
        _ = try cx.evalOnce();
    }

    while (try cx.generate(&params.sampling)) |content| {
        try ctx.sendJson(.{ .content = content });
    }
}
