const builtin = @import("builtin");
const std = @import("std");
const server = @import("../server.zig");
const util = @import("../util.zig");

pub fn @"POST /download"(ctx: *server.Context) !void {
    const url = try ctx.readJson([]const u8);
    inline for (.{ "Content-Type", "Content-Length", "Host", "Referer", "Origin" }) |h| {
        _ = ctx.res.request.headers.delete(h);
    }

    var client: std.http.Client = .{ .allocator = ctx.arena };
    defer client.deinit();

    if (builtin.target.os.tag == .windows) {
        try client.ca_bundle.rescan(ctx.arena);
        const start = client.ca_bundle.bytes.items.len;
        try client.ca_bundle.bytes.appendSlice(ctx.arena, @embedFile("../windows/amazon1.cer"));
        try client.ca_bundle.parseCert(ctx.arena, @intCast(start), std.time.timestamp());
    }

    var req = try client.open(.GET, try std.Uri.parse(url), ctx.res.request.headers, .{});
    defer req.deinit();

    try req.send(.{});
    try req.wait();

    if (req.response.status != .ok) {
        return ctx.sendJson(.{ .@"error" = try std.fmt.allocPrint(ctx.arena, "Invalid status code: `{d}`", .{req.response.status}) });
    }

    const content_type = req.response.headers.getFirstValue("Content-Type") orelse "";
    if (!std.mem.eql(u8, content_type, "binary/octet-stream")) {
        return ctx.sendJson(.{ .@"error" = try std.fmt.allocPrint(ctx.arena, "Invalid content type: `{s}`", .{content_type}) });
    }

    var path = try util.getWritableHomePath(ctx.arena, &.{ "models", std.fs.path.basename(url) });
    var tmp_path = try std.fmt.allocPrint(ctx.arena, "{s}.part", .{path});
    var file = try std.fs.createFileAbsolute(tmp_path, .{});
    defer file.close();
    errdefer std.fs.deleteFileAbsolute(tmp_path) catch {};

    var reader = req.reader();
    var writer = file.writer();

    // connection buffer seems to be 80KB so let's do two reads per write
    var buf: [160 * 1024]u8 = undefined;
    var progress: usize = 0;
    while (reader.readAll(&buf)) |n| {
        try writer.writeAll(buf[0..n]);
        if (n < buf.len) break;

        progress += n;
        try ctx.sendJson(.{ .progress = progress });
    } else |_| return ctx.sendJson(.{ .@"error" = "Failed to download the model" });

    try std.fs.renameAbsolute(tmp_path, path);
    try ctx.sendJson(.{ .path = path });
}
