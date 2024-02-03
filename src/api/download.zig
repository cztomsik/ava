const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");
const util = @import("../util.zig");

pub fn @"POST /download"(allocator: std.mem.Allocator, sreq: *tk.Request, r: *tk.Responder, params: struct { url: []const u8 }) !void {
    inline for (.{ "Content-Type", "Content-Length", "Host", "Referer", "Origin" }) |h| {
        _ = sreq.headers.delete(h);
    }

    var client: std.http.Client = .{ .allocator = allocator };
    defer client.deinit();

    if (builtin.target.os.tag == .windows) {
        try client.ca_bundle.rescan(allocator);
        const start = client.ca_bundle.bytes.items.len;
        try client.ca_bundle.bytes.appendSlice(allocator, @embedFile("../windows/amazon1.cer"));
        try client.ca_bundle.parseCert(allocator, @intCast(start), std.time.timestamp());
    }

    var req = try client.open(.GET, try std.Uri.parse(params.url), sreq.headers, .{});
    defer req.deinit();

    try req.send(.{});
    try req.wait();

    if (req.response.status != .ok) {
        return r.sendJson(.{ .@"error" = try std.fmt.allocPrint(allocator, "Invalid status code: `{d}`", .{req.response.status}) });
    }

    const content_type = req.response.headers.getFirstValue("Content-Type") orelse "";
    if (!std.mem.eql(u8, content_type, "binary/octet-stream")) {
        return r.sendJson(.{ .@"error" = try std.fmt.allocPrint(allocator, "Invalid content type: `{s}`", .{content_type}) });
    }

    const path = try util.getWritableHomePath(allocator, &.{ "models", std.fs.path.basename(params.url) });
    const tmp_path = try std.fmt.allocPrint(allocator, "{s}.part", .{path});
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
        try r.sendJson(.{ .progress = progress });
    } else |_| return r.sendJson(.{ .@"error" = "Failed to download the model" });

    try std.fs.renameAbsolute(tmp_path, path);
    try r.sendJson(.{ .path = path });
}
