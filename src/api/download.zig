const std = @import("std");
const tk = @import("tokamak");
const util = @import("../util.zig");

pub fn @"POST /download"(allocator: std.mem.Allocator, client: *std.http.Client, res: *tk.Response, params: struct { url: []const u8 }) !void {
    var head: [10 * 1024]u8 = undefined;
    var req = try client.open(.GET, try std.Uri.parse(params.url), .{ .server_header_buffer = &head });
    defer req.deinit();

    try req.send(.{});
    try req.wait();

    if (req.response.status != .ok) {
        return res.sendJson(.{ .@"error" = try std.fmt.allocPrint(allocator, "Invalid status code: `{d}`", .{req.response.status}) });
    }

    const content_type = req.response.content_type orelse "";
    if (!std.mem.eql(u8, content_type, "binary/octet-stream")) {
        return res.sendJson(.{ .@"error" = try std.fmt.allocPrint(allocator, "Invalid content type: `{s}`", .{content_type}) });
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
        try res.sendJson(.{ .progress = progress });
    } else |_| return res.sendJson(.{ .@"error" = "Failed to download the model" });

    try std.fs.renameAbsolute(tmp_path, path);
    try res.sendJson(.{ .path = path });
}
