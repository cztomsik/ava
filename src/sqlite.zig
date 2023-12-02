const std = @import("std");
const log = std.log.scoped(.sqlite);

const c = @cImport(
    @cInclude("sqlite3.h"),
);

/// A SQLite database connection.
pub const SQLite3 = struct {
    db: *c.sqlite3,

    /// Opens a database connection in read/write mode, creating the file if it
    /// doesn't exist. The connection is safe to use from multiple threads and
    /// will serialize access to the database.
    pub fn open(filename: [*:0]const u8) !SQLite3 {
        const flags = c.SQLITE_OPEN_READWRITE | c.SQLITE_OPEN_CREATE | c.SQLITE_OPEN_FULLMUTEX;

        var db: ?*c.sqlite3 = null;
        try check(c.sqlite3_open_v2(filename, &db, flags, null));

        return .{
            .db = db.?,
        };
    }

    /// Closes the database connection.
    pub fn close(self: *SQLite3) void {
        _ = c.sqlite3_close(self.db);
    }

    /// Executes the given SQL, ignoring any rows it returns.
    pub fn exec(self: *SQLite3, sql: []const u8, args: anytype) !void {
        var stmt = try self.query(sql, args);
        defer stmt.deinit();

        try stmt.exec();
    }

    /// Returns the number of rows affected by the last INSERT, UPDATE or
    /// DELETE statement.
    pub fn rowsAffected(self: *SQLite3) !usize {
        return @intCast(c.sqlite3_changes(self.db));
    }

    /// Shorthand for `self.query(sql, args).read(T)` where `T` is a primitive
    /// type. Returns the first value of the first row returned by the query.
    pub fn get(self: *SQLite3, comptime T: type, sql: []const u8, args: anytype) !T {
        var stmt = try self.query(sql, args);
        defer stmt.deinit();

        return switch (@typeInfo(T)) {
            .Int, .Float, .Bool => stmt.read(T),
            else => @compileError("Only primitive types are supported"),
        };
    }

    /// Shorthand for `self.query(sql, args).read([]const u8)`. Returns the
    /// first column of the first row returned by the query. The returned slice
    /// needs to be freed by the caller.
    pub fn getString(self: *SQLite3, allocator: std.mem.Allocator, sql: []const u8, args: anytype) ![]const u8 {
        var stmt = try self.query(sql, args);
        defer stmt.deinit();

        return allocator.dupe(u8, try stmt.read([]const u8));
    }

    /// Shorthand for `self.prepare(sql).bindAll(args)`. Returns the prepared
    /// statement which still needs to be executed (and deinitialized).
    pub fn query(self: *SQLite3, sql: []const u8, args: anytype) !Statement {
        var stmt = try self.prepare(sql);
        try stmt.bindAll(args);
        return stmt;
    }

    /// Creates a prepared statement from the given SQL.
    pub fn prepare(self: *SQLite3, sql: []const u8) !Statement {
        errdefer log.err("Failed to prepare SQL: {s}\n", .{sql});

        var stmt: ?*c.sqlite3_stmt = null;
        var tail: [*c]const u8 = null;
        try check(c.sqlite3_prepare_v2(self.db, sql.ptr, @intCast(sql.len), &stmt, &tail));

        if (tail != null and tail != sql.ptr + sql.len) {
            const rest = sql[@intFromPtr(tail) - @intFromPtr(sql.ptr) ..];
            log.err("Trailing SQL({}): {s}\n", .{ rest.len, rest });
            return error.SQLiteError;
        }

        return .{
            .stmt = stmt.?,
            .sql = sql,
        };
    }
};

/// A prepared statement.
pub const Statement = struct {
    stmt: *c.sqlite3_stmt,
    sql: []const u8,

    /// Deinitializes the prepared statement.
    pub fn deinit(self: *Statement) void {
        _ = c.sqlite3_finalize(self.stmt);
    }

    /// Binds the given argument to the prepared statement.
    pub fn bind(self: *Statement, index: usize, arg: anytype) !void {
        const i: c_int = @intCast(index + 1);

        try check(switch (@TypeOf(arg)) {
            bool => c.sqlite3_bind_int(self.stmt, i, if (arg) 1 else 0),
            i32 => c.sqlite3_bind_int(self.stmt, i, arg),
            u32, i64 => c.sqlite3_bind_int64(self.stmt, i, arg),
            f64 => c.sqlite3_bind_double(self.stmt, i, arg),
            []const u8 => c.sqlite3_bind_text(self.stmt, i, arg.ptr, @intCast(arg.len), null),
            else => |T| {
                if (comptime @typeInfo(T) == .Optional) {
                    return if (arg == null) check(c.sqlite3_bind_null(self.stmt, i)) else self.bind(index, arg.?);
                }

                @compileError("TODO " ++ @typeName(T));
            },
        });
    }

    /// Binds the given arguments to the prepared statement.
    /// Works with both structs and tuples.
    pub fn bindAll(self: *Statement, args: anytype) !void {
        inline for (std.meta.fields(@TypeOf(args)), 0..) |f, i| {
            try self.bind(i, @field(args, f.name));
        }
    }

    /// Executes the prepared statement, ignoring any rows it returns.
    pub fn exec(self: *Statement) !void {
        while (try self.step() != .done) {}
    }

    /// Reads the next row, either into a struct/tuple or a single value from
    /// the first column. Returns `error.NoRows` if there are no more rows.
    pub fn read(self: *Statement, comptime T: type) !T {
        if (try self.step() != .row) return error.NoRows;

        if (comptime @typeInfo(T) == .Struct) {
            var res: T = undefined;

            inline for (std.meta.fields(T), 0..) |f, i| {
                @field(res, f.name) = try self.column(f.type, i);
            }

            return res;
        }

        return self.column(T, 0);
    }

    /// Returns an iterator over the rows returned by the prepared statement.
    pub fn iterator(self: *Statement, comptime T: type) RowIterator(T) {
        return .{
            .stmt = self,
        };
    }

    /// Gets the value of the given column.
    pub fn column(self: *Statement, comptime T: type, index: usize) !T {
        const i: c_int = @intCast(index);

        return switch (T) {
            bool => c.sqlite3_column_int(self.stmt, i) != 0,
            u32, i32 => @intCast(c.sqlite3_column_int64(self.stmt, i)),
            f32, f64 => @floatCast(c.sqlite3_column_double(self.stmt, i)),
            []const u8 => try self.column(?[]const u8, index) orelse error.NullPointer,
            ?[]const u8 => {
                const len = c.sqlite3_column_bytes(self.stmt, i);
                const data = c.sqlite3_column_text(self.stmt, i);

                return if (data != null) data[0..@intCast(len)] else null;
            },
            else => @compileError("TODO: " ++ @typeName(T)),
        };
    }

    pub fn step(self: *Statement) !enum { row, done } {
        const code = c.sqlite3_step(self.stmt);

        return switch (code) {
            c.SQLITE_ROW => return .row,
            c.SQLITE_DONE => return .done,
            else => {
                try check(code);
                unreachable;
            },
        };
    }
};

pub fn RowIterator(comptime T: type) type {
    return struct {
        stmt: *Statement,

        pub fn next(self: *RowIterator(T)) !?T {
            errdefer log.err("Failed to read row: {s}\n", .{self.stmt.sql});

            return self.stmt.read(T) catch |e| if (e == error.NoRows) null else e;
        }
    };
}

pub fn check(code: c_int) !void {
    switch (code) {
        c.SQLITE_OK, c.SQLITE_DONE, c.SQLITE_ROW => return,
        else => {
            log.err("SQLite error: {} {s}", .{ code, c.sqlite3_errstr(code) });
            return error.SQLiteError;
        },
    }
}
