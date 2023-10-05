const std = @import("std");
const platform = @import("platform.zig");
const sqlite = @import("sqlite.zig");
const migrate = @import("db_migrate.zig").migrate;

pub const Prompt = struct {
    id: u32,
    name: []const u8,
    prompt: []const u8,
};

pub const Chat = struct {
    id: u32,
    name: []const u8,
    system_prompt: ?[]const u8,
};

pub const ChatMessage = struct {
    id: u32,
    chat_id: u32,
    role: []const u8,
    content: []const u8,
};

var db: sqlite.SQLite3 = undefined;

pub fn init(allocator: std.mem.Allocator) !void {
    var db_file = try std.fmt.allocPrintZ(allocator, "{s}/Library/Application Support/AvaPLS/db", .{platform.getHome()});
    defer allocator.free(db_file);

    std.fs.makeDirAbsolute(std.fs.path.dirname(db_file).?) catch {};
    db = try sqlite.SQLite3.open(db_file);

    try migrate(allocator, &db);
}

pub fn deinit() void {
    db.close();
}

pub fn exec(sql: []const u8, args: anytype) !void {
    return db.exec(sql, args);
}

pub fn query(sql: []const u8, args: anytype) !sqlite.Statement {
    return db.query(sql, args);
}

// TODO: later
// pub fn insert(comptime T: type, values: anytype) !std.meta.FieldType(T, .id) {
//     comptime var fields: []const u8 = "";
//     comptime var placeholders: []const u8 = "";
//
//     inline for (std.meta.fields(T), 0..) |f, i| {
//         if (i != 0) {
//             fields = fields ++ ", ";
//             placeholders = placeholders ++ ", ";
//         }
//
//         fields = fields ++ f.name;
//         placeholders = placeholders ++ "?";
//     }
//
//     var stmt = try db.query(comptime "INSERT INTO " ++ tableName(T) ++ "(" ++ fields ++ ") VALUES(" ++ placeholders ++ ") RETURNING id", values);
//     defer stmt.deinit();
//
//     return stmt.read(std.meta.FieldType(T, .id));
// }
//
// pub fn delete(comptime T: type, id: std.meta.FieldType(T, .id)) !void {
//     return exec("DELETE FROM " ++ tableName(T) ++ " WHERE id = ?", .{id});
// }
//
// fn tableName(comptime T: type) []const u8 {
//     return std.fs.path.extension(@typeName(T))[1..];
// }
