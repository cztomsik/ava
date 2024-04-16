const std = @import("std");
const tk = @import("tokamak");
const ava = @import("../app.zig");

const Params = struct {
    path: []const u8,
    url: []const u8,
};

pub fn @"POST /download"(app: *ava.App, client: *std.http.Client, res: *tk.Response, params: Params) !void {
    if (std.mem.indexOf(u8, params.path, "..") != null) {
        return res.sendJson(.{ .@"error" = .{ .invalid_path = params.path } });
    }

    var head: [10 * 1024]u8 = undefined;
    var req = try client.open(.GET, try std.Uri.parse(params.url), .{ .server_header_buffer = &head });
    defer req.deinit();

    try req.send();
    try req.wait();

    if (req.response.status != .ok) {
        return res.sendJson(.{ .@"error" = .{ .invalid_status = req.response.status } });
    }

    if (req.response.content_length) |size| {
        try res.sendJson(.{ .size = size });
    }

    const content_type = req.response.content_type orelse "";
    if (!std.mem.eql(u8, content_type, "binary/octet-stream")) {
        return res.sendJson(.{ .@"error" = .{ .invalid_content_type = content_type } });
    }

    const path = try std.fs.path.join(res.req.allocator, &.{ app.config.value.download.path, params.path });
    const tmp_path = try std.fmt.allocPrint(res.req.allocator, "{s}.part", .{path});
    errdefer app.home_dir.deleteFile(tmp_path) catch {};

    // .close() needs to be called before .rename() on Windows
    {
        var file = try app.openFile(tmp_path, .w);
        defer file.close();

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
    }

    try app.home_dir.rename(tmp_path, path);
    try res.sendJson(.{
        .path = try app.home_dir.realpathAlloc(res.req.allocator, path),
    });
}
