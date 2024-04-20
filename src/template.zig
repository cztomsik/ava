// TODO: consider switching to jinja/swig/xxx syntax because we could use this also for chat templates

const std = @import("std");

pub const Template = struct {
    tokens: std.ArrayList(Token),

    pub fn parse(allocator: std.mem.Allocator, input: []const u8) !Template {
        var tokens = std.ArrayList(Token).init(allocator);
        errdefer tokens.deinit();

        var stack = std.ArrayList(struct { usize, []const u8 }).init(allocator);
        defer stack.deinit();

        var tokenizer = Tokenizer{ .input = input };

        while (tokenizer.next()) |tok| {
            switch (tok) {
                .section_open => |section| try stack.append(.{ tokens.items.len, section.name }),

                .section_close => |name| {
                    const index, const open = stack.popOrNull() orelse return error.MissingSectionOpen;

                    if (!std.mem.eql(u8, open, name)) {
                        return error.MismatchedSection;
                    }

                    tokens.items[index].section_open.skip = tokens.items.len - index;
                },

                else => {},
            }

            try tokens.append(tok);
        }

        return .{
            .tokens = tokens,
        };
    }

    pub fn deinit(self: *Template) void {
        self.tokens.deinit();
    }

    // TODO: accept anytype, but expect json.Value union(enum) shape
    pub fn render(self: *const Template, data: std.json.Value, writer: anytype) !void {
        try renderPart(self.tokens.items, data, writer);
    }

    pub fn renderAlloc(self: *const Template, allocator: std.mem.Allocator, data: std.json.Value) ![]const u8 {
        var buf = std.ArrayList(u8).init(allocator);
        errdefer buf.deinit();

        try self.render(data, buf.writer());

        return buf.toOwnedSlice();
    }

    fn renderPart(tokens: []const Token, data: std.json.Value, writer: anytype) !void {
        var i: usize = 0;

        while (i < tokens.len) : (i += 1) {
            switch (tokens[i]) {
                .text => |text| try writer.writeAll(text),

                .variable => |name| {
                    const val = if (name.len == 1 and name[0] == '.') data else (data.object.get(name) orelse continue);

                    switch (val) {
                        .null => {},
                        .bool => |v| try writer.writeAll(if (v) "true" else "false"),
                        .string, .number_string => |v| try writer.writeAll(v),
                        inline else => |v| try writer.print("{}", .{v}),
                    }
                },

                .section_open => |sec| {
                    defer i += sec.skip;
                    const next = tokens[i + 1 ..];
                    const val = data.object.get(sec.name) orelse .null;

                    const truthy = switch (val) {
                        .null => false,
                        .bool => |v| v,
                        .integer => |v| v != 0,
                        .float => |v| v != 0.0,
                        .string, .number_string => |v| v.len > 0,
                        .array => |arr| arr.items.len > 0,
                        .object => |_| true,
                    };

                    if (sec.inverted == truthy) {
                        continue;
                    }

                    if (sec.inverted) {
                        try renderPart(next, data, writer);
                        continue;
                    }

                    switch (val) {
                        .object => try renderPart(next, val, writer),
                        .array => |arr| for (arr.items) |it| try renderPart(next, it, writer),
                        else => try renderPart(next, data, writer),
                    }
                },

                .section_close => |_| return,
            }
        }
    }
};

fn expectRender(tpl: Template, data: anytype, expected: []const u8) !void {
    const json = try std.json.stringifyAlloc(std.testing.allocator, data, .{});
    defer std.testing.allocator.free(json);

    const parsed = try std.json.parseFromSlice(std.json.Value, std.testing.allocator, json, .{});
    defer parsed.deinit();

    const res = try tpl.renderAlloc(std.testing.allocator, parsed.value);
    defer std.testing.allocator.free(res);

    try std.testing.expectEqualStrings(expected, res);
}

test "Template" {
    var tpl = try Template.parse(std.testing.allocator, "Hello {{#name}}{{name}}{{/name}}{{^name}}World{{/name}}");
    defer tpl.deinit();

    try expectRender(tpl, .{ .name = "Alice" }, "Hello Alice");
    try expectRender(tpl, .{ .name = null }, "Hello World");
    try expectRender(tpl, .{ .name = "" }, "Hello World");
    try expectRender(tpl, .{ .name = [_]u32{} }, "Hello World");
    try expectRender(tpl, .{ .name = struct {}{} }, "Hello ");

    var tpl2 = try Template.parse(std.testing.allocator, "{{#names}}- {{.}}\n{{/names}}{{^names}}No names{{/names}}");
    defer tpl2.deinit();

    try expectRender(tpl2, .{ .names = .{} }, "No names");
    try expectRender(tpl2, .{ .names = .{ "first", "second" } }, "- first\n- second\n");
}

/// A token in a mustache template
const Token = union(enum) {
    text: []const u8,
    variable: []const u8,
    section_open: struct {
        name: []const u8,
        inverted: bool = false,
        skip: usize = 0,
    },
    section_close: []const u8,
};

const Tag = std.meta.Tag(Token);

const Tokenizer = struct {
    input: []const u8,
    pos: usize = 0,

    fn next(self: *Tokenizer) ?Token {
        const start = self.pos;

        while (self.pos < self.input.len) : (self.pos += 1) {
            if (self.startsWith("{{")) {
                if (self.pos > start) {
                    return .{ .text = self.input[start..self.pos] };
                } else {
                    self.pos += 2;
                }

                if (self.consumeIdent()) |name| {
                    if (self.consumeSeq("}}")) {
                        return .{ .variable = name };
                    }
                }

                if (self.consumeSeq("#")) {
                    if (self.consumeIdent()) |name| {
                        if (self.consumeSeq("}}")) {
                            return .{ .section_open = .{ .name = name } };
                        }
                    }
                }

                if (self.consumeSeq("^")) {
                    if (self.consumeIdent()) |name| {
                        if (self.consumeSeq("}}")) {
                            return .{ .section_open = .{ .name = name, .inverted = true } };
                        }
                    }
                }

                if (self.consumeSeq("/")) {
                    if (self.consumeIdent()) |name| {
                        if (self.consumeSeq("}}")) {
                            return .{ .section_close = name };
                        }
                    }
                }

                return .{ .text = self.input[start..self.pos] };
            }
        }

        if (start < self.pos) {
            return .{ .text = self.input[start..self.pos] };
        }

        return null;
    }

    fn startsWith(self: *Tokenizer, seq: []const u8) bool {
        return std.mem.startsWith(u8, self.input[self.pos..], seq);
    }

    fn consumeSeq(self: *Tokenizer, seq: []const u8) bool {
        if (self.startsWith(seq)) {
            self.pos += seq.len;
            return true;
        }

        return false;
    }

    fn consumeIdent(self: *Tokenizer) ?[]const u8 {
        const start = self.pos;

        while (self.pos < self.input.len) {
            switch (self.input[self.pos]) {
                'a'...'z', 'A'...'Z', '0'...'9', '_', '.' => self.pos += 1,
                else => break,
            }
        }

        return if (self.pos > start) self.input[start..self.pos] else null;
    }
};

fn expectTokens(tpl: []const u8, tokens: []const Tag) !void {
    var tokenizer = Tokenizer{ .input = tpl };

    for (tokens) |tag| {
        const tok: Tag = tokenizer.next() orelse return error.Eof;
        errdefer std.debug.print("rest: {s}\n", .{tokenizer.input[tokenizer.pos..]});

        try std.testing.expectEqual(tag, tok);
    }

    try std.testing.expectEqual(tpl.len, tokenizer.pos);
}

test "Tokenizer" {
    try expectTokens("", &.{});

    try expectTokens("Hello", &.{.text});
    try expectTokens("{{name}}", &.{.variable});
    try expectTokens("{{#name}}", &.{.section_open});
    try expectTokens("{{^name}}", &.{.section_open});
    try expectTokens("{{/name}}", &.{.section_close});

    try expectTokens("Hello {{name}}", &.{ .text, .variable });
    try expectTokens("{{#name}}{{/name}}", &.{ .section_open, .section_close });
}
