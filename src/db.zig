const std = @import("std");
const util = @import("util.zig");
const sqlite = @import("ava-sqlite");

pub const Model = struct {
    id: u32,
    name: []const u8,
    path: []const u8,
    imported: bool,
};

pub const Prompt = struct {
    id: u32,
    name: []const u8,
    prompt: []const u8,
};

pub const Chat = struct {
    id: u32,
    name: []const u8,
    prompt: ?[]const u8,
};

pub const ChatMessage = struct {
    id: u32,
    chat_id: u32,
    role: []const u8,
    content: []const u8,
};

var db: sqlite.SQLite3 = undefined;

pub fn init(allocator: std.mem.Allocator) !void {
    const db_file = try util.getWritableHomePath(allocator, &.{"db"});
    defer allocator.free(db_file);

    db = try sqlite.SQLite3.open(db_file);
    try sqlite.migrate(allocator, &db, @embedFile("db_schema.sql"));
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

pub fn get(comptime T: type, sql: []const u8, args: anytype) !T {
    return db.get(T, sql, args);
}

pub fn getString(allocator: std.mem.Allocator, sql: []const u8, args: anytype) ![]const u8 {
    return db.getString(allocator, sql, args);
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
