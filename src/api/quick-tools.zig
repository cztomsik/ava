const std = @import("std");
const tk = @import("tokamak");
const fr = @import("fridge");
const schema = @import("../schema.zig");
const llama = @import("../llama.zig");
const completions = @import("completions.zig");

const GenerateParams = struct {
    model: []const u8,
    data: std.json.Value,
    max_tokens: u32 = 2048,

    // Copy-pasted from llama.SamplingParams
    seed: u32 = 0,
    top_k: u32 = 40,
    top_p: f32 = 0.5,
    temperature: f32 = 0.7,
    repeat_n_last: usize = 256,
    repeat_penalty: f32 = 1.05,
    presence_penalty: f32 = 0,
    frequency_penalty: f32 = 0,
    json: bool = false,
};

pub fn @"GET /quick-tools"(db: *fr.Session) ![]const schema.QuickTool {
    return db.query(schema.QuickTool).orderBy(.id, .asc).findAll();
}

pub fn @"GET /quick-tools/:id"(db: *fr.Session, id: u32) !schema.QuickTool {
    return try db.find(schema.QuickTool, id) orelse error.NotFound;
}

pub fn @"POST /quick-tools"(db: *fr.Session, data: schema.QuickTool) !schema.QuickTool {
    return db.create(schema.QuickTool, data);
}

pub fn @"PUT /quick-tools/:id"(db: *fr.Session, id: u32, data: schema.QuickTool) !void {
    try db.update(schema.QuickTool, id, data);
}

pub fn @"POST /quick-tools/:id/generate"(ctx: *tk.Context, db: *fr.Session, id: u32, params: GenerateParams) !void {
    const tool = try db.find(schema.QuickTool, id) orelse return error.NotFound;
    const tpl = try tk.tpl.Template.parse(ctx.allocator, tool.prompt);
    const prompt = try tpl.renderAlloc(ctx.allocator, params.data);

    std.log.debug("Generating with prompt: {s}", .{prompt});

    return ctx.send(ctx.injector.callArgs(completions.@"POST /chat/completions", .{completions.Params{
        .model = params.model,
        .prompt = prompt,
        .max_tokens = params.max_tokens,

        .seed = params.seed,
        .top_k = params.top_k,
        .top_p = params.top_p,
        .temperature = params.temperature,
        .repeat_n_last = params.repeat_n_last,
        .repeat_penalty = params.repeat_penalty,
        .presence_penalty = params.presence_penalty,
        .frequency_penalty = params.frequency_penalty,
        .json = params.json,
    }}));
}

pub fn @"DELETE /quick-tools/:id"(db: *fr.Session, id: u32) !void {
    try db.delete(schema.QuickTool, id);
}
