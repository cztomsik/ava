const std = @import("std");
const builtin = @import("builtin");
const api = @import("api.zig");
const log = std.log.scoped(.server);

/// A context for handling a request.
pub const Context = struct {
    arena: std.mem.Allocator,
    res: std.http.Server.Response,
    path: []const u8,
    query: ?[]const u8,

    pub fn deinit(self: *Context) void {
        _ = self.res.reset();
        self.res.deinit();

        var arena: *std.heap.ArenaAllocator = @ptrCast(@alignCast(self.arena.ptr));
        arena.deinit();
        arena.child_allocator.destroy(arena);
    }

    pub fn match(self: *const Context, pattern: []const u8) ?Params {
        return Params.match(pattern, self.path);
    }

    pub fn router(self: *Context, comptime routes: type) !void {
        inline for (@typeInfo(routes).Struct.decls) |d| {
            const method = comptime d.name[0 .. std.mem.indexOfScalar(u8, d.name, ' ') orelse unreachable];
            const pattern = d.name[method.len + 1 ..];

            if (self.res.request.method == @field(std.http.Method, method)) {
                if (self.match(pattern)) |params| {
                    const handler = comptime @field(api, d.name);

                    var args: std.meta.ArgsTuple(@TypeOf(handler)) = undefined;
                    args[0] = self;
                    inline for (1..args.len) |i| {
                        const V = @TypeOf(args[i]);
                        args[i] = try if (comptime @typeInfo(V) == .Struct) self.readJson(V) else params.get(i - 1, V);
                    }

                    return @call(.auto, handler, args);
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
            .{ .ignore_unknown_fields = true },
        );
    }

    /// Sends a chunk of data. Automatically sets the transfer encoding to
    /// chunked if it hasn't been set yet.
    pub fn sendChunk(self: *Context, chunk: []const u8) !void {
        if (self.res.state == .waited) {
            self.res.transfer_encoding = .chunked;
            try self.res.send();
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

        if (comptime std.meta.hasFn(@TypeOf(body), "next")) {
            var copy = body;
            var i: usize = 0;

            try writer.writeAll("[");
            while (try copy.next()) |item| : (i += 1) {
                if (i != 0) try writer.writeAll(",");
                try std.json.stringify(item, .{}, writer);
            }
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

    /// Sends an empty response.
    pub fn noContent(self: *Context) !void {
        self.res.status = .no_content;
        try self.res.send();
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
    allocator: std.mem.Allocator,
    http: std.http.Server,
    thread: std.Thread,
    status: std.atomic.Value(enum(u8) { starting, started, stopping, stopped }) = .{ .raw = .starting },

    pub fn start(allocator: std.mem.Allocator, hostname: []const u8, port: u16) !*Server {
        const self = try allocator.create(Server);
        errdefer allocator.destroy(self);

        var http = std.http.Server.init(.{ .reuse_address = true });
        errdefer http.deinit();

        const address = try std.net.Address.parseIp(hostname, port);
        try http.listen(address);

        self.* = .{
            .allocator = allocator,
            .http = http,
            .thread = try std.Thread.spawn(.{}, run, .{self}),
        };

        return self;
    }

    pub fn deinit(self: *Server) void {
        self.status.store(.stopping, .Release);

        if (std.net.tcpConnectToAddress(self.http.socket.listen_address)) |conn| {
            conn.close();
        } else |e| log.err("stop err: {}", .{e});

        while (self.status.load(.Acquire) == .stopping) {
            std.time.sleep(100_000_000);
        }

        self.http.deinit();
        self.allocator.destroy(self);
    }

    fn run(self: *Server) !void {
        self.status.store(.started, .Release);
        defer self.status.store(.stopped, .Release);

        while (self.status.load(.Acquire) == .started) {
            // accidental moving/copying would invalidate pointers inside
            var arena = try self.allocator.create(std.heap.ArenaAllocator);
            errdefer self.allocator.destroy(arena);
            arena.* = std.heap.ArenaAllocator.init(self.allocator);
            errdefer arena.deinit();

            const res = try self.http.accept(.{
                .allocator = arena.allocator(),
                .header_strategy = .{ .dynamic = 10_000 },
            });

            // Sent from Server.deinit() to awake the thread
            if (self.status.load(.Acquire) == .stopping) return;

            var thread = try std.Thread.spawn(.{}, runInThread, .{res});
            thread.detach();
        }
    }

    fn runInThread(res: std.http.Server.Response) !void {
        var ctx = Context{
            .arena = res.allocator,
            .res = res,
            .path = undefined,
            .query = undefined,
        };
        defer ctx.deinit();

        // Keep it simple
        try ctx.res.headers.append("Connection", "close");

        // Wait for the request to be fully read
        try ctx.res.wait();
        const uri = try std.Uri.parseWithoutScheme(ctx.res.request.target);
        ctx.path = uri.path;
        ctx.query = uri.query;

        defer {
            if (ctx.res.state == .waited) ctx.res.send() catch {};
            ctx.res.finish() catch {};
            log.debug("{s} {s} {}", .{ @tagName(ctx.res.request.method), ctx.res.request.target, @intFromEnum(ctx.res.status) });
        }

        handleRequest(&ctx) catch |e| {
            if (e == error.OutOfMemory) return e;

            log.debug("handleRequest: {}", .{e});

            ctx.res.status = switch (e) {
                error.NotFound => .not_found,
                else => .internal_server_error,
            };

            ctx.sendJson(.{ .@"error" = e }) catch {};
        };
    }

    fn handleRequest(ctx: *Context) anyerror!void {
        // handle API requests
        if (ctx.match("/api/*")) |_| {
            ctx.path = ctx.path[4..];
            return ctx.router(api);
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

const Params = struct {
    matches: [16][]const u8 = undefined,
    len: usize = 0,

    fn match(pattern: []const u8, path: []const u8) ?Params {
        var res = Params{};
        var pattern_parts = std.mem.tokenizeScalar(u8, pattern, '/');
        var path_parts = std.mem.tokenizeScalar(u8, path, '/');

        while (true) {
            const pat = pattern_parts.next() orelse return if (pattern[pattern.len - 1] == '*' or path_parts.next() == null) res else null;
            const pth = path_parts.next() orelse return null;
            const dynamic = pat[0] == ':' or pat[0] == '*';

            if (std.mem.indexOfScalar(u8, pat, '.')) |i| {
                const j = (if (dynamic) std.mem.lastIndexOfScalar(u8, pth, '.') else std.mem.indexOfScalar(u8, pth, '.')) orelse return null;

                if (match(pat[i + 1 ..], pth[j + 1 ..])) |ch| {
                    for (ch.matches, res.len..) |s, l| res.matches[l] = s;
                    res.len += ch.len;
                } else return null;
            }

            if (!dynamic and !std.mem.eql(u8, pat, pth)) return null;

            if (pat[0] == ':') {
                res.matches[res.len] = pth;
                res.len += 1;
            }
        }
    }

    fn get(self: *const Params, index: usize, comptime T: type) !T {
        const s = if (index < self.len) self.matches[index] else return error.NoMatch;

        return switch (@typeInfo(T)) {
            .Int => std.fmt.parseInt(T, s, 10),
            else => s,
        };
    }
};

fn mime(comptime ext: []const u8) []const u8 {
    const mime_types = std.ComptimeStringMap([]const u8, .{
        .{ ".html", "text/html" },
        .{ ".css", "text/css" },
        .{ ".js", "text/javascript" },
        .{ ".md", "text/markdown" },
    });

    return mime_types.get(ext) orelse "application/octet-stream";
}
