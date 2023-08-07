const std = @import("std");
const builtin = @import("builtin");

pub const Server = struct {
    http: std.http.Server,
    thread: std.Thread,

    pub fn start(allocator: std.mem.Allocator, hostname: []const u8, port: u16) !*Server {
        var self = try allocator.create(Server);
        errdefer allocator.destroy(self);

        var http = std.http.Server.init(allocator, .{ .reuse_address = true });
        errdefer http.deinit();

        const address = try std.net.Address.parseIp(hostname, port);
        try http.listen(address);

        self.* = .{
            .http = http,
            .thread = try std.Thread.spawn(.{}, run, .{self}),
        };

        return self;
    }

    pub fn deinit(self: *Server) void {
        self.http.deinit();
        self.http.allocator.destroy(self);
    }

    fn run(self: *Server) !void {
        while (true) {
            var req_arena = std.heap.ArenaAllocator.init(self.http.allocator);
            defer req_arena.deinit();

            var res = try self.http.accept(.{
                .allocator = req_arena.allocator(),
                .header_strategy = .{ .dynamic = 10_000 },
            });
            defer res.deinit();
            defer _ = res.reset();

            try res.wait();
            try handleRequest(&res.request, &res);
        }
    }

    fn handleRequest(req: *std.http.Server.Request, res: *std.http.Server.Response) !void {
        const uri = try std.Uri.parseWithoutScheme(req.target);

        if (std.mem.startsWith(u8, uri.path, "/api")) {
            @panic("TODO");
        }

        if (std.mem.eql(u8, uri.path, "/app.js")) {
            return serveResource(res, "src/app/dist/main.js");
        }

        if (std.mem.eql(u8, uri.path, "/bootstrap.min.css")) {
            return serveResource(res, "node_modules/bootstrap/dist/css/bootstrap.min.css");
        }

        try serveResource(res, "src/app/index.html");
    }

    pub fn serveResource(res: *std.http.Server.Response, comptime path: []const u8) !void {
        res.transfer_encoding = .chunked;

        try res.headers.append("Content-Type", comptime mime(std.fs.path.extension(path)) ++ "; charset=utf-8");
        try res.do();

        try res.writeAll(if (comptime builtin.mode != .Debug) @embedFile("../" ++ path) else blk: {
            var f = try std.fs.cwd().openFile(path, .{});
            defer f.close();
            break :blk try f.readToEndAlloc(res.allocator, std.math.maxInt(usize));
        });

        try res.finish();
    }

    fn mime(comptime ext: []const u8) []const u8 {
        const mime_types = std.ComptimeStringMap([]const u8, .{
            .{ ".html", "text/html" },
            .{ ".css", "text/css" },
            .{ ".js", "text/javascript" },
        });

        return mime_types.get(ext) orelse "application/octet-stream";
    }
};
