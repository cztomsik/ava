const std = @import("std");
const com = @import("com.zig");
const util = @import("../util.zig");
const L = std.unicode.utf8ToUtf16LeStringLiteral;
const c = struct {
    usingnamespace std.os.windows;
    usingnamespace std.os.windows.kernel32;
    usingnamespace std.os.windows.user32;

    usingnamespace @cImport({
        @cInclude("ava.h");
    });

    const PAINTSTRUCT = extern struct { hdc: ?c.HDC, fErase: c.BOOL, rcPaint: c.RECT, fRestore: c.BOOL, fIncUpdate: c.BOOL, rgbReserved: [32]u8 };
    extern "user32" fn GetClientRect(hWnd: ?c.HWND, lpRect: ?*c.RECT) callconv(c.WINAPI) c.BOOL;
    extern "user32" fn GetUpdateRect(hWnd: ?c.HWND, lpRect: ?*c.RECT, erase: c.BOOL) callconv(c.WINAPI) c.BOOL;
    extern "user32" fn BeginPaint(hWnd: ?c.HWND, lpPaint: ?*c.PAINTSTRUCT) callconv(c.WINAPI) c.HDC;
    extern "user32" fn DrawTextA(hdc: ?c.HDC, lpchText: [*:0]const u8, cchText: i32, lprc: ?*c.RECT, format: u32) callconv(c.WINAPI) i32;
    extern "user32" fn EndPaint(hWnd: ?c.HWND, lpPaint: ?*c.PAINTSTRUCT) callconv(c.WINAPI) c.BOOL;
    extern "WebView2Loader.dll" fn CreateCoreWebView2EnvironmentWithOptions(browser_folder: ?c.PCWSTR, data_folder: ?c.PCWSTR, options: ?*anyopaque, handler: *com.ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler) callconv(c.WINAPI) c.HRESULT;
};
const allocator = std.heap.page_allocator;

pub const std_options = struct {
    pub const log_level = .debug;
};

// Globals
var window: c.HWND = undefined;
var webview: *com.ICoreWebView2 = undefined;
var controller: *com.ICoreWebView2Controller = undefined;
var webview_initialized = std.atomic.Atomic(bool).init(false);

pub fn main() !u8 {
    errdefer |e| showError(e);

    std.log.debug("Starting the server", .{});
    if (c.ava_start() > 0) return error.FailedToStartServer;

    std.log.debug("Creating the window", .{});
    try createWindow();

    std.log.debug("Creating the webview", .{});
    try createWebView();

    std.log.debug("Navigating to the webui", .{});
    // TODO: ava_port()
    _ = webview.call(.Navigate, .{L("http://127.0.0.1:3002")});

    std.log.debug("Entering the main loop", .{});
    while (tick() > 0) {}

    std.log.debug("Stopping the server", .{});
    _ = c.ava_stop();

    std.log.debug("Releasing COM objects", .{});
    _ = webview.Release();
    _ = controller.Release();
    return 0;
}

fn createWindow() !void {
    const CLASS_NAME = L("AvaPLS");
    const TITLE = L("Ava PLS");

    var wc = std.mem.zeroes(c.WNDCLASSEXW);
    wc.cbSize = @sizeOf(c.WNDCLASSEXW);
    wc.hInstance = @ptrCast(c.GetModuleHandleW(null) orelse return error.FailedToGetModuleHandle);
    wc.lpszClassName = CLASS_NAME;
    wc.lpfnWndProc = handleMessage;

    if (c.RegisterClassExW(&wc) == 0) {
        return error.FailedToRegisterWindowClass;
    }

    var hWnd = c.CreateWindowExW(
        0,
        CLASS_NAME,
        TITLE,
        c.WS_OVERLAPPEDWINDOW,
        c.CW_USEDEFAULT,
        c.CW_USEDEFAULT,
        c.CW_USEDEFAULT,
        c.CW_USEDEFAULT,
        null,
        null,
        wc.hInstance,
        null,
    ) orelse return error.FailedToCreateWindow;

    _ = c.ShowWindow(hWnd, c.SW_SHOW);
    _ = c.UpdateWindow(hWnd);

    window = hWnd;
}

// Window handler
fn handleMessage(hWnd: c.HWND, message: c.UINT, wParam: c.WPARAM, lParam: c.LPARAM) callconv(c.WINAPI) c.LRESULT {
    switch (message) {
        c.WM_QUIT => return 0,
        c.WM_DESTROY => {
            c.PostQuitMessage(0);
            return 0;
        },
        c.WM_SIZE => resize(),
        c.WM_PAINT => {
            if (!webview_initialized.load(.Acquire)) {
                var rect: c.RECT = undefined;
                if (c.GetUpdateRect(window, &rect, c.FALSE) == 0) return 0;

                var ps: c.PAINTSTRUCT = undefined;
                const dc = c.BeginPaint(window, &ps);
                _ = c.GetClientRect(window, &rect);
                _ = c.DrawTextA(dc, "Loading...", -1, &rect, 1 | 4 | 32);
                _ = c.EndPaint(window, &ps);
                return 0;
            }
        },
        else => {},
    }

    return c.DefWindowProcW(hWnd, message, wParam, lParam);
}

fn createWebView() !void {
    const data_folder = try util.getWritableHomePath(allocator, &.{"webview"});
    defer allocator.free(data_folder);

    const data_folder_w = try std.unicode.utf8ToUtf16LeWithNull(allocator, data_folder);
    defer allocator.free(data_folder_w);

    _ = c.CreateCoreWebView2EnvironmentWithOptions(
        null,
        data_folder_w.ptr,
        null,
        com.Callback(com.ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, environmentCompleted),
    );

    // Wait for the environment to be created
    while (!webview_initialized.load(.Acquire) and tick() > 0) {}
}

fn environmentCompleted(_: *com.ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, res: c.HRESULT, env: *com.ICoreWebView2Environment) callconv(c.WINAPI) c.HRESULT {
    if (res != c.S_OK) {
        showError(error.FailedToCreateWebViewEnvironment);
        return res;
    }

    return env.call(.CreateCoreWebView2Controller, .{ window, com.Callback(com.ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, controllerCompleted) });
}

fn controllerCompleted(_: *com.ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, res: c.HRESULT, ctrl: *com.ICoreWebView2Controller) callconv(c.WINAPI) c.HRESULT {
    if (res == c.S_OK) {
        controller = ctrl;

        if (ctrl.call(.get_CoreWebView2, .{&webview}) == c.S_OK) {
            _ = ctrl.AddRef();
            _ = webview.AddRef();

            // Disable dev tools
            var settings: *com.ICoreWebView2Settings = undefined;
            _ = webview.call(.get_Settings, .{&settings});
            _ = settings.call(.put_AreDevToolsEnabled, .{c.FALSE});
        }
    }

    webview_initialized.store(true, .Release);

    std.log.debug("Resizing", .{});
    resize();

    return res;
}

fn resize() void {
    if (!webview_initialized.load(.Acquire)) return;
    var bounds: c.RECT = undefined;
    _ = c.GetClientRect(window, &bounds);
    _ = controller.call(.put_Bounds, .{bounds});
}

// Do one tick of the message loop
fn tick() c.LRESULT {
    var msg: c.MSG = undefined;

    if (c.GetMessageW(&msg, null, 0, 0) >= 0) {
        _ = c.TranslateMessage(&msg);
        const res = c.DispatchMessageW(&msg);

        return if (msg.message == c.WM_QUIT) res else 1;
    }

    return 0;
}

// Show a message box with an error message
fn showError(err: anytype) void {
    const msg = std.fmt.allocPrintZ(std.heap.page_allocator, "Unexpected error: {any}", .{err}) catch "OOM";

    _ = c.MessageBoxA(null, msg, "Error", c.MB_OK);
}
