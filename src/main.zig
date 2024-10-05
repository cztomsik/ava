const builtin = @import("builtin");
const options = @import("options");
const std = @import("std");
const tk = @import("tokamak");
const llama = @import("llama.zig");
const App = @import("app.zig").App;

pub const std_options = .{
    .log_level = .debug,
    .logFn = log,
};

pub var app: ?*App = null;

fn log(comptime level: std.log.Level, comptime scope: @Type(.enum_literal), comptime fmt: []const u8, args: anytype) void {
    if (app) |inst| {
        return inst.log(level, scope, fmt, args);
    }

    std.log.defaultLog(level, scope, fmt, args);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    app = try App.init(gpa.allocator());
    defer app.?.deinit();

    const thread = try std.Thread.spawn(.{}, tk.Server.start, .{app.?.server});
    defer thread.join();

    if (comptime options.headless) {
        const banner =
            \\
            \\  /\ \  / /\             Server running
            \\ /--\ \/ /--\            http://127.0.0.1:{}
            \\ _____________________________________________
            \\
            \\
        ;

        std.debug.print(banner, .{
            app.?.config.value.server.port,
        });
    } else {
        const c = @cImport({
            @cInclude("stddef.h");
            @cInclude("webview.h");
        });

        const w = c.webview_create(if (builtin.mode == .Debug) 1 else 0, null);
        defer _ = c.webview_destroy(w);

        _ = c.webview_set_title(w, "Ava PLS");
        _ = c.webview_set_size(w, 800, 600, c.WEBVIEW_HINT_NONE);

        if (comptime builtin.os.tag == .macos) {
            // TODO: fix window dragging first
            // _ = objc.send1(void, c.webview_get_window(w), "setStyleMask:", @as(c_int, 1 | 2 | 4 | 8 | (1 << 15)));
            // _ = objc.send1(void, c.webview_get_window(w), "setTitleVisibility:", @as(c_int, 1));
            // _ = objc.send1(void, c.webview_get_window(w), "setTitlebarAppearsTransparent:", @as(c_char, 1));
        }

        // TODO: wait
        _ = c.webview_navigate(w, "http://127.0.0.1:3002");
        _ = c.webview_run(w);

        app.?.server.stop();
    }
}

const objc = struct {
    const o = @cImport({
        @cInclude("objc/runtime.h");
        @cInclude("objc/message.h");
    });

    fn send1(comptime R: type, target: anytype, sel: [*:0]const u8, arg: anytype) void {
        const s = o.sel_registerName(sel);
        const f: *const fn (@TypeOf(target), @TypeOf(s), @TypeOf(arg)) callconv(.C) R = @ptrCast(&o.objc_msgSend);
        return f(target, s, arg);
    }
};
