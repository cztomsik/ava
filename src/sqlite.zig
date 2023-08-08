const std = @import("std");

const c = @cImport(
    @cInclude("sqlite3.h"),
);

pub usingnamespace c;

pub const SQLite3 = opaque {
    fn ptr(self: *SQLite3) *c.sqlite3 {
        return @ptrCast(self);
    }

    /// Opens a database connection in read/write mode, creating the file if it
    /// doesn't exist. The connection is safe to use from multiple threads and
    /// will serialize access to the database.
    pub fn open(filename: [*:0]const u8) !*SQLite3 {
        const flags = c.SQLITE_OPEN_READWRITE | c.SQLITE_OPEN_CREATE | c.SQLITE_OPEN_FULLMUTEX;

        var db: ?*c.sqlite3 = null;
        try check(c.sqlite3_open_v2(filename, &db, flags, null));

        return @ptrCast(db.?);
    }

    /// Closes the database connection.
    pub fn deinit(self: *SQLite3) !void {
        try check(c.sqlite3_close(self.ptr()));
    }

    /// Executes the given SQL statement. This is a shorthand for preparing and
    /// executing the statement.
    pub fn exec(self: *SQLite3, sql: []const u8, args: anytype) !void {
        var stmt = try self.prepare(sql);
        defer stmt.deinit();

        try stmt.exec(args);
    }

    /// Executes the given SQL statement and returns the first row/value. This
    /// is a shorthand for preparing, executing and reading the statement.
    /// Returns `error.SQLiteError` if the statement doesn't return any rows.
    pub fn one(self: *SQLite3, comptime T: type, sql: []const u8, args: anytype) !T {
        var stmt = try self.prepare(sql);
        defer stmt.deinit();

        return stmt.one(T, args);
    }

    /// Creates a prepared statement from the given SQL.
    pub fn prepare(self: *SQLite3, sql: []const u8) !*Statement {
        errdefer std.log.err("Failed to prepare SQL: {s}\n", .{sql});

        var stmt: ?*c.sqlite3_stmt = null;
        try check(c.sqlite3_prepare_v2(self.ptr(), sql.ptr, @intCast(sql.len), &stmt, null));

        return @ptrCast(stmt.?);
    }
};

pub const Statement = opaque {
    fn ptr(self: *Statement) *c.sqlite3_stmt {
        return @ptrCast(self);
    }

    /// Deinitializes the prepared statement.
    pub fn deinit(self: *Statement) void {
        _ = c.sqlite3_finalize(self.ptr());
    }

    /// Resets the prepared statement, allowing it to be executed again.
    pub fn reset(self: *Statement) !void {
        try check(c.sqlite3_reset(self.ptr()));
    }

    /// Executes the prepared statement with the given arguments.
    pub fn exec(self: *Statement, args: anytype) !void {
        try self.bindAll(args);

        while (try self.step() != .done) {}
    }

    /// Executes the prepared statement and returns the first row/value.
    /// Returns `error.SQLiteError` if the statement doesn't return any rows.
    pub fn one(self: *Statement, comptime T: type, args: anytype) !T {
        try self.bindAll(args);

        return switch (try self.step()) {
            .row => self.read(T),
            .done => error.SQLiteError,
        };
    }

    /// Binds the given argument to the prepared statement.
    pub fn bind(self: *Statement, index: usize, arg: anytype) !void {
        const i: c_int = @intCast(index);

        try check(switch (@TypeOf(arg)) {
            bool => c.sqlite3_bind_int(self.ptr(), i, if (arg) 1 else 0),
            i32 => c.sqlite3_bind_int(self.ptr(), i, arg),
            i64 => c.sqlite3_bind_int64(self.ptr(), i, arg),
            f64 => c.sqlite3_bind_double(self.ptr(), i, arg),
            []const u8 => c.sqlite3_bind_text(self.ptr(), i, arg.ptr, @intCast(arg.len), null),
            else => @compileError("TODO"),
        });
    }

    /// Binds the given arguments to the prepared statement.
    pub fn bindAll(self: *Statement, args: anytype) !void {
        for (args, 0..) |arg, n| {
            try self.bindArg(n, arg);
        }
    }

    /// Reads either the whole row if the given type is a struct, or the first
    /// column if it's a primitive.
    pub fn read(self: *Statement, comptime T: type) !T {
        if (comptime std.meta.trait.is(.Struct)(T)) {
            var res: T = undefined;

            inline for (std.meta.fields(T), 0..) |f, i| {
                @field(res, f.name) = try self.read(f.type, i);
            }

            return res;
        }

        return self.column(T, 0);
    }

    /// Gets the value of the given column.
    pub fn column(self: *Statement, comptime T: type, index: usize) !T {
        const i: c_int = @intCast(index);

        switch (T) {
            bool => c.sqlite3_column_int(self.ptr(), i) != 0,
            i32 => c.sqlite3_column_int(self.ptr(), i),
            i64 => c.sqlite3_column_int64(self.ptr(), i),
            f64 => c.sqlite3_column_double(self.ptr(), i),
            []const u8 => {
                const len = c.sqlite3_column_bytes(self.ptr(), i);
                const data = c.sqlite3_column_text(self.ptr(), i);
                return data[0..@intCast(len)];
            },
            else => @compileError("TODO"),
        }
    }

    fn step(self: *Statement) !enum { row, done } {
        const code = c.sqlite3_step(self.ptr());

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

pub fn check(code: c_int) !void {
    switch (code) {
        c.SQLITE_OK, c.SQLITE_DONE, c.SQLITE_ROW => return,
        else => {
            std.log.err("SQLite error: {}", .{code});
            return error.SQLiteError;
        },
    }
}
