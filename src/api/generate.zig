const std = @import("std");
const tk = @import("tokamak");
const sqlite = @import("ava-sqlite");
const llama = @import("../llama.zig");

const GenerateParams = struct {
    model_id: u32,
    prompt: []const u8,
    max_tokens: u32 = 2048,
    trim_first: bool = false,
    sampling: llama.SamplingParams = .{},
};

pub fn @"POST /generate"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, pool: *llama.Pool, r: *tk.Responder, params: GenerateParams) !void {
    try r.sendJson(.{ .status = "Waiting for the model..." });
    const model_path = try db.getString(allocator, "SELECT path FROM Model WHERE id = ?", .{params.model_id});
    var cx = try pool.get(model_path, 60_000);
    defer pool.release(cx);

    try r.sendJson(.{ .status = "Reading the history..." });
    try cx.prepare(params.prompt, &params.sampling);

    while (cx.n_past < cx.tokens.items.len) {
        try r.sendJson(.{ .status = try std.fmt.allocPrint(allocator, "Reading the history... ({}/{})", .{ cx.n_past, cx.tokens.items.len }) });
        _ = try cx.evalOnce();
    }

    // TODO: send enums/unions
    try r.sendJson(.{ .status = "" });

    var tokens: u32 = 0;

    while (try cx.generate(&params.sampling)) |content| {
        try r.sendJson(.{
            .content = if (tokens == 0 and params.trim_first) std.mem.trimLeft(u8, content, " \t\n\r") else content,
        });

        tokens += 1;
        if (tokens >= params.max_tokens) break;
    }
}
