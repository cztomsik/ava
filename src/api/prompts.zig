const db = @import("../db.zig");
const server = @import("../server.zig");

pub fn @"GET /prompts"(ctx: *server.Context) !void {
    var stmt = try db.query("SELECT * FROM Prompt ORDER BY id", .{});
    defer stmt.deinit();

    return ctx.sendJson(stmt.iterator(db.Prompt));
}

pub fn @"POST /prompts"(ctx: *server.Context) !void {
    const data = try ctx.readJson(struct {
        name: []const u8,
        prompt: []const u8,
    });

    var stmt = try db.query("INSERT INTO Prompt (name, prompt) VALUES (?, ?) RETURNING *", .{ data.name, data.prompt });
    defer stmt.deinit();

    try ctx.sendJson(try stmt.read(db.Prompt));
}

pub fn @"DELETE /prompts/:id"(ctx: *server.Context, id: u32) !void {
    try db.exec("DELETE FROM Prompt WHERE id = ?", .{id});
    return ctx.noContent();
}
