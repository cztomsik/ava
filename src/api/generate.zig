const std = @import("std");
const server = @import("../server.zig");
const db = @import("../db.zig");
const llama = @import("../llama.zig");

const GenerateParams = struct {
    model_id: u32,
    prompt: []const u8,
    max_tokens: u32 = 2048,
    trim_first: bool = false,
    sampling: llama.SamplingParams = .{},
};

pub fn @"POST /generate"(ctx: *server.Context, params: GenerateParams) !void {
    try ctx.sendJson(.{ .status = "Waiting for the model..." });
    const model_path = try db.getString(ctx.arena, "SELECT path FROM Model WHERE id = ?", .{params.model_id});
    var cx = try llama.Pool.get(model_path, 60_000);
    defer llama.Pool.release(cx);

    try ctx.sendJson(.{ .status = "Reading the history..." });
    try cx.prepare(params.prompt, params.sampling.add_bos);

    while (cx.n_past < cx.tokens.items.len) {
        try ctx.sendJson(.{ .status = try std.fmt.allocPrint(ctx.arena, "Reading the history... ({}/{})", .{ cx.n_past, cx.tokens.items.len }) });
        _ = try cx.evalOnce();
    }

    // TODO: send enums/unions
    try ctx.sendJson(.{ .status = "" });

    var tokens: u32 = 0;

    while (try cx.generate(&params.sampling)) |content| {
        try ctx.sendJson(.{
            .content = if (tokens == 0 and params.trim_first) std.mem.trimLeft(u8, content, " \t\n\r") else content,
        });

        tokens += 1;
        if (tokens >= params.max_tokens) break;
    }
}
