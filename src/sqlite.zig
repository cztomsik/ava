const std = @import("std");

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
    pub fn close(self: *SQLite3) !void {
        try check(c.sqlite3_close(self.db));
    }

    /// Creates a prepared statement from the given SQL.
    pub fn prepare(self: *SQLite3, sql: []const u8) !Statement {
        errdefer std.log.err("Failed to prepare SQL: {s}\n", .{sql});

        var stmt: ?*c.sqlite3_stmt = null;
        try check(c.sqlite3_prepare_v2(self.db, sql.ptr, @intCast(sql.len), &stmt, null));

        return .{
            .stmt = stmt.?,
        };
    }
};

/// A prepared statement.
pub const Statement = struct {
    stmt: *c.sqlite3_stmt,

    /// Deinitializes the prepared statement.
    pub fn deinit(self: *Statement) void {
        _ = c.sqlite3_finalize(self.stmt);
    }

    /// Binds the given argument to the prepared statement.
    pub fn bind(self: *Statement, index: usize, arg: anytype) !void {
        const i: c_int = @intCast(index);

        try check(switch (@TypeOf(arg)) {
            bool => c.sqlite3_bind_int(self.stmt, i, if (arg) 1 else 0),
            i32 => c.sqlite3_bind_int(self.stmt, i, arg),
            i64 => c.sqlite3_bind_int64(self.stmt, i, arg),
            f64 => c.sqlite3_bind_double(self.stmt, i, arg),
            []const u8 => c.sqlite3_bind_text(self.stmt, i, arg.ptr, @intCast(arg.len), null),
            else => @compileError("TODO"),
        });
    }

    /// Binds the given arguments to the prepared statement.
    /// Works with both structs and tuples.
    pub fn bindAll(self: *Statement, args: anytype) !void {
        for (std.meta.fields(@TypeOf(args)), 0..) |f, i| {
            try self.bindArg(i, @field(args, f.name));
        }
    }

    /// Reads the next row, either into a struct/tuple or a single value from
    /// the first column. Returns `error.NoRows` if there are no more rows.
    pub fn read(self: *Statement, comptime T: type) !T {
        if (try self.step() != .row) return error.NoRows;

        if (comptime std.meta.trait.is(.Struct)(T)) {
            var res: T = undefined;

            inline for (std.meta.fields(T), 0..) |f, i| {
                @field(res, f.name) = try self.read(f.type, i);
            }

            return res;
        }

        return self.column(T, 0);
    }

    pub fn iterator(self: *Statement, comptime T: type) !RowIterator(T) {
        return .{
            .stmt = self,
        };
    }

    /// Gets the value of the given column.
    pub fn column(self: *Statement, comptime T: type, index: usize) !T {
        const i: c_int = @intCast(index);

        switch (T) {
            bool => c.sqlite3_column_int(self.stmt, i) != 0,
            i32 => c.sqlite3_column_int(self.stmt, i),
            i64 => c.sqlite3_column_int64(self.stmt, i),
            f64 => c.sqlite3_column_double(self.stmt, i),
            []const u8 => {
                const len = c.sqlite3_column_bytes(self.stmt, i);
                const data = c.sqlite3_column_text(self.stmt, i);
                return data[0..@intCast(len)];
            },
            else => @compileError("TODO"),
        }
    }

    fn step(self: *Statement) !enum { row, done } {
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
            return try self.stmt.read(T) catch |e| if (e == error.NoRows) null else e;
        }
    };
}

pub fn check(code: c_int) !void {
    switch (code) {
        c.SQLITE_OK, c.SQLITE_DONE, c.SQLITE_ROW => return,
        else => {
            std.log.err("SQLite error: {}", .{code});
            return error.SQLiteError;
        },
    }
}
