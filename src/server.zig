const std = @import("std");
const builtin = @import("builtin");
const api = @import("api.zig");

/// A context for handling a request.
pub const Context = struct {
    arena: std.mem.Allocator,
    res: std.http.Server.Response,
    path: []const u8,
    query: ?[]const u8,

    pub fn init(http: *std.http.Server, arena: std.mem.Allocator) !Context {
        var res = try http.accept(.{
            .allocator = arena,
            .header_strategy = .{ .dynamic = 10_000 },
        });
        try res.headers.append("Connection", "close");
        try res.wait();

        const uri = try std.Uri.parseWithoutScheme(res.request.target);

        return .{
            .arena = arena,
            .res = res,

            // TODO: check lifetime, maybe we need to dupe this?
            .path = uri.path,
            .query = uri.query,
        };
    }

    pub fn deinit(self: *Context) void {
        _ = self.res.reset();
        self.res.deinit();
    }

    pub fn match(self: *const Context, pattern: []const u8) bool {
        return matchPath(pattern, self.path);
    }

    /// Reads the request body as JSON.
    pub fn readJson(self: *Context, comptime T: type) !T {
        var reader = std.json.reader(self.arena, self.res.reader());

        return std.json.parseFromTokenSourceLeaky(
            T,
            self.arena,
            &reader,
            .{},
        );
    }

    /// Sends a chunk of data. Automatically sets the transfer encoding to
    /// chunked if it hasn't been set yet.
    pub fn sendChunk(self: *Context, chunk: []const u8) !void {
        if (self.res.state == .waited) {
            self.res.transfer_encoding = .chunked;
            try self.res.do();
        }

        // Response.write() will always write all of the data when the transfer
        // encoding is chunked
        _ = try self.res.write(chunk);
    }

    /// Sends a chunk of JSON. The chunk always ends with a newline.
    pub fn sendJson(self: *Context, body: anytype) !void {
        if (self.res.state == .waited) {
            try self.res.headers.append("Content-Type", "application/json");
        }

        var list = std.ArrayList(u8).init(self.arena);
        defer list.deinit();

        try std.json.stringifyArbitraryDepth(self.arena, body, .{}, list.writer());
        try list.appendSlice("\r\n");
        try self.sendChunk(list.items);
    }

    /// Sends a static resource. The resource is embedded in release builds.
    pub fn sendResource(self: *Context, comptime path: []const u8) !void {
        try self.res.headers.append("Content-Type", comptime mime(std.fs.path.extension(path)) ++ "; charset=utf-8");

        try self.sendChunk(if (comptime builtin.mode != .Debug) @embedFile("../" ++ path) else blk: {
            var f = try std.fs.cwd().openFile(path, .{});
            defer f.close();
            break :blk try f.readToEndAlloc(self.arena, std.math.maxInt(usize));
        });
    }
};

/// An instance of our HTTP server.
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
            // arena contains pointers so let's keep it on stack to avoid
            // accidental moving & copying which would invalidate the pointers
            var arena = std.heap.ArenaAllocator.init(self.http.allocator);
            defer arena.deinit();

            var ctx = try Context.init(&self.http, arena.allocator());
            defer ctx.deinit();

            defer {
                if (ctx.res.state == .waited) ctx.res.do() catch {};
                ctx.res.finish() catch {};
                std.log.debug("{s} {s} {}", .{ @tagName(ctx.res.request.method), ctx.path, @intFromEnum(ctx.res.status) });
            }

            handleRequest(&ctx) catch |e| {
                if (e == error.OutOfMemory) return e;

                std.log.debug("handleRequest: {}", .{e});
                ctx.res.status = .internal_server_error;
            };
        }
    }

    fn handleRequest(ctx: *Context) !void {
        // handle API requests
        if (ctx.match("/api/*")) return api.handler(ctx);

        // TODO: should be .get() but it's not implemented yet
        if (ctx.match("/favicon.ico")) return ctx.sendResource("src/app/favicon.ico");
        if (ctx.match("/app.js")) return ctx.sendResource("zig-out/js/main.js");
        if (ctx.match("/bootstrap.min.css")) return ctx.sendResource("node_modules/bootstrap/dist/css/bootstrap.min.css");

        // disable source maps in production
        if (ctx.match("*.map")) return ctx.sendChunk("{}");

        // HTML5 fallback
        try ctx.sendResource("src/app/index.html");
    }
};

fn matchPath(pattern: []const u8, path: []const u8) bool {
    var pattern_parts = std.mem.tokenizeScalar(u8, pattern, '/');
    var path_parts = std.mem.tokenizeScalar(u8, path, '/');

    while (true) {
        const pat = pattern_parts.next() orelse return true;
        const pth = path_parts.next() orelse return false;
        const dynamic = pat[0] == ':' or pat[0] == '*';

        if (std.mem.indexOfScalar(u8, pat, '.')) |i| {
            const j = (if (dynamic) std.mem.lastIndexOfScalar(u8, pth, '.') else std.mem.indexOfScalar(u8, pth, '.')) orelse return false;

            if (!matchPath(pat[i + 1 ..], pth[j + 1 ..])) return false;
        }

        if (!dynamic and !std.mem.eql(u8, pat, pth)) return false;
    }
}

fn mime(comptime ext: []const u8) []const u8 {
    const mime_types = std.ComptimeStringMap([]const u8, .{
        .{ ".html", "text/html" },
        .{ ".css", "text/css" },
        .{ ".js", "text/javascript" },
    });

    return mime_types.get(ext) orelse "application/octet-stream";
}
