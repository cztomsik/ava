const std = @import("std");
const tk = @import("tokamak");
const ava = @import("../app.zig");

const Params = struct {
    url: []const u8,
    path: []const u8,
};

pub fn @"POST /download"(app: *ava.App, client: *std.http.Client, ctx: *tk.Context, params: Params) !tk.EventStream(Download) {
    if (std.mem.indexOf(u8, params.path, "..") != null) {
        return error.InvalidPath;
    }

    // TODO: redesign everything fs-related
    const home = try app.home_dir.realpathAlloc(ctx.allocator, ".");
    const path = try std.fs.path.join(ctx.allocator, &.{ app.config.value.download.path, params.path });

    return .{
        .impl = .{
            .client = client,
            .url = params.url,
            .path = try std.fs.path.resolve(ctx.allocator, &.{ home, path }),
            .file = try app.openFile(path, .w),
        },
    };
}

const Download = struct {
    client: *std.http.Client,
    url: []const u8,
    path: []const u8,
    file: std.fs.File,
    req: ?std.http.Client.Request = null,
    size: usize = 0,
    progress: usize = 0,
    finished: bool = false,

    const Event = union(enum) { size: usize, progress: usize, path: []const u8 };

    pub fn deinit(self: *Download) void {
        if (self.req) |*r| r.deinit();
        self.file.close();
    }

    pub fn next(self: *Download) !?Event {
        if (self.req == null) return try self.start();
        if (self.progress < self.size) return try self.read();
        if (!self.finished) return self.finish();

        return null;
    }

    fn start(self: *Download) !Event {
        const uri = try std.Uri.parse(self.url);

        var head: [10 * 1024]u8 = undefined;
        var req = try self.client.open(.GET, uri, .{ .server_header_buffer = &head });
        errdefer req.deinit();

        try req.send();
        try req.wait();

        if (req.response.status != .ok) {
            return error.NotOk;
        }

        if (!std.mem.eql(u8, req.response.content_type orelse "", "binary/octet-stream")) {
            return error.InvalidContentType;
        }

        self.req = req;
        self.size = req.response.content_length orelse return error.UnknownSize;

        return .{ .size = self.size };
    }

    fn read(self: *Download) !Event {
        var reader = self.req.?.reader();
        var writer = self.file.writer();

        // connection buffer seems to be 80KB so let's do two reads per write
        var buf: [160 * 1024]u8 = undefined;
        const n = try reader.readAll(&buf);
        try writer.writeAll(buf[0..n]);

        self.progress += n;
        return .{ .progress = self.progress };
    }

    fn finish(self: *Download) Event {
        self.finished = true;
        return .{ .path = self.path };
    }
};
