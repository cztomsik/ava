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

    pub fn match(self: *const Context, pattern: []const u8) ?[][]const u8 {
        return matchPath(pattern, self.path);
    }

    pub fn route(self: *Context, comptime routes: type) !void {
        inline for (@typeInfo(routes).Struct.decls) |d| {
            const method = comptime d.name[0 .. std.mem.indexOfScalar(u8, d.name, ' ') orelse unreachable];
            const pattern = d.name[method.len + 1 ..];

            if (self.res.request.method == @field(std.http.Method, method)) {
                if (self.match(pattern)) |matches| {
                    const handler = comptime @field(api, d.name);

                    var args: std.meta.ArgsTuple(@TypeOf(handler)) = undefined;
                    args[0] = self;
                    inline for (1..args.len) |i| args[i] = try parse(@TypeOf(args[i]), matches[i - 1]);

                    return @call(.auto, @field(api, d.name), args);
                }
            }
        }

        return error.NotFound;
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
    /// Supports values, slices and iterators.
    pub fn sendJson(self: *Context, body: anytype) !void {
        if (self.res.state == .waited) {
            try self.res.headers.append("Content-Type", "application/json");
        }

        var list = std.ArrayList(u8).init(self.arena);
        var writer = list.writer();
        defer list.deinit();

        if (comptime std.meta.trait.hasFn("next")(@TypeOf(body))) {
            var copy = body;

            try writer.writeAll("[");
            while (try copy.next()) |item| try std.json.stringify(item, .{}, writer);
            try writer.writeAll("]");
        } else {
            try std.json.stringify(body, .{}, writer);
        }

        try list.appendSlice("\r\n");
        try self.sendChunk(list.items);
    }

    /// Sends a static resource. The resource is embedded in release builds.
    pub fn sendResource(self: *Context, comptime path: []const u8) !void {
        try self.res.headers.append("Content-Type", comptime mime(std.fs.path.extension(path)) ++ "; charset=utf-8");
        try self.noCache();

        try self.sendChunk(if (comptime builtin.mode != .Debug) @embedFile("../" ++ path) else blk: {
            var f = try std.fs.cwd().openFile(path, .{});
            defer f.close();
            break :blk try f.readToEndAlloc(self.arena, std.math.maxInt(usize));
        });
    }

    /// Adds no-cache headers to the response.
    pub fn noCache(self: *Context) !void {
        try self.res.headers.append("Cache-Control", "no-cache, no-store, must-revalidate");
        try self.res.headers.append("Pragma", "no-cache");
        try self.res.headers.append("Expires", "0");
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
                std.log.debug("{s} {s} {}", .{ @tagName(ctx.res.request.method), ctx.res.request.target, @intFromEnum(ctx.res.status) });
            }

            handleRequest(&ctx) catch |e| {
                if (e == error.OutOfMemory) return e;

                std.log.debug("handleRequest: {}", .{e});
                ctx.res.status = switch (e) {
                    error.NotFound => .not_found,
                    else => .internal_server_error,
                };
            };
        }
    }

    fn handleRequest(ctx: *Context) anyerror!void {
        // handle API requests
        if (ctx.match("/api/*")) |_| {
            ctx.path = ctx.path[4..];
            return ctx.route(api);
        }

        // TODO: should be .get() but it's not implemented yet
        if (ctx.match("/LICENSE.md")) |_| return ctx.sendResource("LICENSE.md");
        if (ctx.match("/favicon.ico")) |_| return ctx.sendResource("src/app/favicon.ico");
        if (ctx.match("/app.js")) |_| return ctx.sendResource("zig-out/app/main.js");

        // disable source maps in production
        if (ctx.match("*.map")) |_| return ctx.sendChunk("{}");

        // HTML5 fallback
        try ctx.sendResource("src/app/index.html");
    }
};

fn matchPath(pattern: []const u8, path: []const u8) ?[][]const u8 {
    var pattern_parts = std.mem.tokenizeScalar(u8, pattern, '/');
    var path_parts = std.mem.tokenizeScalar(u8, path, '/');
    var matches: [16][]const u8 = undefined;
    var len: usize = 0;

    while (true) {
        const pat = pattern_parts.next() orelse return if (pattern[pattern.len - 1] == '*' or path_parts.next() == null) matches[0..len] else null;
        const pth = path_parts.next() orelse return null;
        const dynamic = pat[0] == ':' or pat[0] == '*';

        if (std.mem.indexOfScalar(u8, pat, '.')) |i| {
            const j = (if (dynamic) std.mem.lastIndexOfScalar(u8, pth, '.') else std.mem.indexOfScalar(u8, pth, '.')) orelse return null;

            if (matchPath(pat[i + 1 ..], pth[j + 1 ..])) |m| {
                for (m, len..) |s, l| matches[l] = s;
                len += m.len;
            } else return null;
        }

        if (!dynamic and !std.mem.eql(u8, pat, pth)) return null;

        if (pat[0] == ':') {
            matches[len] = pth;
            len += 1;
        }
    }
}

fn parse(comptime T: type, s: []const u8) !T {
    return switch (@typeInfo(T)) {
        .Int => std.fmt.parseInt(T, s, 10),
        else => s,
    };
}

fn mime(comptime ext: []const u8) []const u8 {
    const mime_types = std.ComptimeStringMap([]const u8, .{
        .{ ".html", "text/html" },
        .{ ".css", "text/css" },
        .{ ".js", "text/javascript" },
        .{ ".md", "text/markdown" },
    });

    return mime_types.get(ext) orelse "application/octet-stream";
}
