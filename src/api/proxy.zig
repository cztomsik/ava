const std = @import("std");
const server = @import("../server.zig");

pub fn @"POST /proxy"(ctx: *server.Context) !void {
    const url = try ctx.readJson([]const u8);

    inline for (.{ "Content-Type", "Content-Length", "Host", "Referer", "Origin" }) |h| {
        _ = ctx.res.request.headers.delete(h);
    }

    var client: std.http.Client = .{ .allocator = ctx.arena };
    defer client.deinit();

    var req = try client.open(.GET, try std.Uri.parse(url), ctx.res.request.headers, .{});
    defer req.deinit();

    try req.send(.{});
    try req.wait();

    ctx.res.status = req.response.status;
    ctx.res.headers = try req.response.headers.clone(ctx.arena);
    ctx.res.transfer_encoding = .chunked;
    _ = ctx.res.headers.delete("Transfer-Encoding");
    _ = ctx.res.headers.delete("Content-Encoding");
    _ = ctx.res.headers.delete("Content-Length");
    try ctx.res.send();

    var buf: [512]u8 = undefined;
    var written: usize = 0;

    while (true) {
        if (written == req.response.content_length) break;
        const n = try req.read(buf[0..]);
        if (n == 0) break;
        try ctx.res.writeAll(buf[0..n]);
        written += n;
    }
}
