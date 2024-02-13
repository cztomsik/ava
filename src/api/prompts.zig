const db = @import("../db.zig");
const tk = @import("tokamak");

pub fn @"GET /prompts"(r: *tk.Responder) !void {
    var stmt = try db.query("SELECT * FROM Prompt ORDER BY id", .{});
    defer stmt.deinit();

    return r.sendJson(stmt.iterator(db.Prompt));
}

pub fn @"POST /prompts"(r: *tk.Responder, data: db.Prompt) !void {
    var stmt = try db.query("INSERT INTO Prompt (name, prompt) VALUES (?, ?) RETURNING *", .{ data.name, data.prompt });
    defer stmt.deinit();

    try r.sendJson(try stmt.read(db.Prompt));
}

pub fn @"DELETE /prompts/:id"(id: u32) !void {
    try db.exec("DELETE FROM Prompt WHERE id = ?", .{id});
}
