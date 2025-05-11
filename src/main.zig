const builtin = @import("builtin");
const options = @import("options");
const std = @import("std");
const tk = @import("tokamak");
const llama = @import("llama.zig");
const ava = @import("app.zig");

pub const std_options: std.Options = .{
    .log_level = .debug,
    .logFn = log,
};

fn log(comptime level: std.log.Level, comptime scope: @Type(.enum_literal), comptime fmt: []const u8, args: anytype) void {
    if (ava.Logger.inst) |inst| {
        inst.log(level, scope, fmt, args);
    } else {
        std.log.defaultLog(level, scope, fmt, args);
    }
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    const ct = try tk.Container.init(gpa.allocator(), &.{ ava.App, tk.app.Base });
    defer ct.deinit();

    const server = try ct.injector.get(*tk.Server);
    const port = server.http.config.port.?;

    const thread = try server.http.listenInNewThread();
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

        std.debug.print(banner, .{port});
    } else {
        const c = @cImport({
            @cInclude("stddef.h");
            @cInclude("webview.h");
        });

        const w = c.webview_create(if (builtin.mode == .Debug) 1 else 0, null);
        defer _ = c.webview_destroy(w);

        _ = c.webview_set_title(w, "Ava PLS");
        _ = c.webview_set_size(w, 1200, 800, c.WEBVIEW_HINT_NONE);

        if (comptime builtin.os.tag == .macos) {
            // TODO: fix window dragging first
            // _ = objc.send1(void, c.webview_get_window(w), "setStyleMask:", @as(c_int, 1 | 2 | 4 | 8 | (1 << 15)));
            // _ = objc.send1(void, c.webview_get_window(w), "setTitleVisibility:", @as(c_int, 1));
            // _ = objc.send1(void, c.webview_get_window(w), "setTitlebarAppearsTransparent:", @as(c_char, 1));
        }

        const url = try std.fmt.allocPrintZ(gpa.allocator(), "http://127.0.0.1:{}", .{port});
        defer gpa.allocator().free(url);

        _ = c.webview_navigate(w, url);
        _ = c.webview_run(w);
        server.stop();
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
