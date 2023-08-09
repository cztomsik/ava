const std = @import("std");
const builtin = @import("builtin");
const handleApiRequest = @import("api/router.zig").handler;

pub const Context = struct {
    req: *std.http.Server.Request,
    res: *std.http.Server.Response,
    path: []const u8,
    query: ?[]const u8,

    pub fn init(req: *std.http.Server.Request, res: *std.http.Server.Response) !Context {
        const uri = try std.Uri.parseWithoutScheme(req.target);

        return .{
            .req = req,
            .res = res,
            .path = uri.path,
            .query = uri.query,
        };
    }

    pub fn sendResource(self: *Context, comptime path: []const u8) !void {
        try self.res.headers.append("Content-Type", comptime mime(std.fs.path.extension(path)) ++ "; charset=utf-8");

        try self.send(if (comptime builtin.mode != .Debug) @embedFile("../" ++ path) else blk: {
            var f = try std.fs.cwd().openFile(path, .{});
            defer f.close();
            break :blk try f.readToEndAlloc(self.res.allocator, std.math.maxInt(usize));
        });
    }

    pub fn send(self: *Context, body: anytype) !void {
        self.res.transfer_encoding = .chunked;
        try self.res.do();

        var writer = self.res.writer();
        try writer.print("{s}", .{body});

        try self.res.finish();
    }
};

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

            var ctx = try Context.init(&res.request, &res);
            defer std.log.debug("{s} {s} {}", .{ @tagName(ctx.req.method), ctx.path, @intFromEnum(ctx.res.status) });

            try handleRequest(&ctx);
        }
    }

    fn handleRequest(ctx: *Context) !void {
        if (std.mem.startsWith(u8, ctx.path, "/api/")) {
            return handleApiRequest(ctx);
        }

        if (std.mem.endsWith(u8, ctx.path, ".map")) {
            return ctx.send("{}");
        }

        if (std.mem.eql(u8, ctx.path, "/favicon.ico")) {
            return ctx.sendResource("src/app/favicon.ico");
        }

        if (std.mem.eql(u8, ctx.path, "/app.js")) {
            return ctx.sendResource("src/app/dist/main.js");
        }

        if (std.mem.eql(u8, ctx.path, "/bootstrap.min.css")) {
            return ctx.sendResource("node_modules/bootstrap/dist/css/bootstrap.min.css");
        }

        try ctx.sendResource("src/app/index.html");
    }
};

fn mime(comptime ext: []const u8) []const u8 {
    const mime_types = std.ComptimeStringMap([]const u8, .{
        .{ ".html", "text/html" },
        .{ ".css", "text/css" },
        .{ ".js", "text/javascript" },
    });

    return mime_types.get(ext) orelse "application/octet-stream";
}
