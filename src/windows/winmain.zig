const std = @import("std");
const com = @import("com.zig");
const L = std.unicode.utf8ToUtf16LeStringLiteral;
const c = struct {
    pub usingnamespace std.os.windows;
    pub usingnamespace std.os.windows.kernel32;
    pub usingnamespace std.os.windows.user32;

    pub usingnamespace @cImport({
        @cInclude("ava.h");
    });

    extern "user32" fn GetClientRect(hWnd: ?c.HWND, lpRect: ?*c.RECT) callconv(c.WINAPI) c.BOOL;
    extern "WebView2Loader.dll" fn CreateCoreWebView2Environment(handler: *com.ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler) callconv(c.WINAPI) c.HRESULT;
};

pub const std_options = struct {
    pub const log_level = .debug;
};

// Globals
var window: c.HWND = undefined;
var wait = std.Thread.Mutex{};
var initialized = false;
var webview: *com.ICoreWebView2 = undefined;
var controller: *com.ICoreWebView2Controller = undefined;

pub fn main() !u8 {
    init() catch |e| {
        showError(e);
        return 1;
    };

    std.log.debug("Navigating to webui", .{});
    // TODO: ava_port()
    _ = webview.call(.Navigate, .{L("http://127.0.0.1:3002")});

    std.log.debug("Entering the main loop", .{});
    while (tick() > 0) {}

    std.log.debug("Stopping server", .{});
    _ = c.ava_stop();

    std.log.debug("Releasing COM objects", .{});
    _ = webview.Release();
    _ = controller.Release();
    return 0;
}

fn init() !void {
    std.log.debug("Creating window", .{});
    try createWindow();

    std.log.debug("Creating webview", .{});
    try createWebView();

    std.log.debug("Resizing", .{});
    initialized = true;
    resize();

    std.log.debug("Starting server", .{});
    if (c.ava_start() > 0) return error.FailedToStartServer;
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
        else => {},
    }

    return c.DefWindowProcW(hWnd, message, wParam, lParam);
}

fn createWebView() !void {
    _ = c.CreateCoreWebView2Environment(com.Callback(com.ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, environmentCompleted));

    // Wait for the environment to be created
    while (!wait.tryLock() and tick() > 0) {}
}

fn environmentCompleted(_: *com.ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, res: c.HRESULT, env: *com.ICoreWebView2Environment) callconv(c.WINAPI) c.HRESULT {
    if (res != c.S_OK) {
        showError(error.FailedToCreateWebViewEnvironment);
        return res;
    }

    wait.lock();
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

    wait.unlock();
    return res;
}

fn resize() void {
    if (!initialized) return;
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
