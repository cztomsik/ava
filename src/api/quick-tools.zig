const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const schema = @import("../schema.zig");
const llama = @import("../llama.zig");
const template = @import("../template.zig");
const generate = @import("generate.zig");

const GenerateParams = struct {
    model: []const u8,
    data: std.json.Value,
    max_tokens: u32 = 2048,
    sampling: llama.SamplingParams = .{},
};

pub fn @"GET /quick-tools"(db: *fr.Session) ![]const schema.QuickTool {
    return db.findAll(fr.query(schema.QuickTool).orderBy(.id, .asc));
}

pub fn @"GET /quick-tools/:id"(db: *fr.Session, id: u32) !schema.QuickTool {
    return try db.find(schema.QuickTool, id) orelse error.NotFound;
}

pub fn @"POST /quick-tools"(db: *fr.Session, data: schema.QuickTool) !schema.QuickTool {
    return db.create(schema.QuickTool, data);
}

pub fn @"PUT /quick-tools/:id"(db: *fr.Session, id: u32, data: schema.QuickTool) !schema.QuickTool {
    try db.update(schema.QuickTool, id, data);

    return try db.find(schema.QuickTool, id) orelse error.NotFound;
}

pub fn @"POST /quick-tools/:id/generate"(ctx: *tk.Context, db: *fr.Session, id: u32, params: GenerateParams) !void {
    const tool = try db.find(schema.QuickTool, id) orelse return error.NotFound;
    const tpl = try template.Template.parse(ctx.allocator, tool.prompt);
    const prompt = try tpl.renderAlloc(ctx.allocator, params.data);

    std.log.debug("Generating with prompt: {s}", .{prompt});

    return ctx.injector.call(generate.@"POST /generate", .{.{
        .model = params.model,
        .prompt = prompt,
        .max_tokens = params.max_tokens,
        .sampling = params.sampling,
    }});
}

pub fn @"DELETE /quick-tools/:id"(db: *fr.Session, id: u32) !void {
    try db.delete(schema.QuickTool, id);
}
