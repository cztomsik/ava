const std = @import("std");
const tk = @import("tokamak");
const sqlite = @import("ava-sqlite");
const llama = @import("../llama.zig");

const GenerateParams = struct {
    model: []const u8,
    prompt: []const u8,
    max_tokens: u32 = 2048,
    trim_first: bool = false,
    sampling: llama.SamplingParams = .{},
};

pub fn @"POST /generate"(allocator: std.mem.Allocator, db: *sqlite.SQLite3, pool: *llama.Pool, res: *tk.Response, params: GenerateParams) !void {
    // TODO: refactor
    try res.setHeader("Content-Type", "application/jsonlines");
    try res.respond();

    try res.sendJson(.{ .status = "Waiting for the model..." });
    const model_path = try db.getString(allocator, "SELECT path FROM Model WHERE name = ?", .{params.model});
    var cx = try pool.get(model_path, 60_000);
    defer pool.release(cx);

    try res.sendJson(.{ .status = "Reading the history..." });
    try cx.prepare(params.prompt, &params.sampling);

    while (cx.n_past < cx.tokens.items.len) {
        try res.sendJson(.{ .status = try std.fmt.allocPrint(allocator, "Reading the history... ({}/{})", .{ cx.n_past, cx.tokens.items.len }) });
        _ = try cx.evalOnce();
    }

    // TODO: send enums/unions
    try res.sendJson(.{ .status = "" });

    var tokens: u32 = 0;

    while (try cx.generate(&params.sampling)) |content| {
        try res.sendJson(.{
            .content = if (tokens == 0 and params.trim_first) std.mem.trimLeft(u8, content, " \t\n\r") else content,
        });

        tokens += 1;
        if (tokens >= params.max_tokens) break;
    }
}
