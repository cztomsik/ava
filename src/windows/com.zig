const std = @import("std");
const c = struct {
    usingnamespace std.os.windows;
    usingnamespace std.os.windows.ole32;
};

pub const ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler = Object(extern struct {
    Invoke: *const fn (self: *ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, res: c.HRESULT, env: *ICoreWebView2Environment) callconv(c.WINAPI) c.HRESULT,
});

pub const ICoreWebView2Environment = Object(extern struct {
    CreateCoreWebView2Controller: *const fn (self: *ICoreWebView2Environment, parentWin: c.HWND, handler: *ICoreWebView2CreateCoreWebView2ControllerCompletedHandler) callconv(c.WINAPI) c.HRESULT,
});

pub const ICoreWebView2CreateCoreWebView2ControllerCompletedHandler = Object(extern struct {
    Invoke: *const fn (self: *ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, res: c.HRESULT, ctrl: *ICoreWebView2Controller) callconv(c.WINAPI) c.HRESULT,
});

pub const ICoreWebView2Controller = Object(extern struct {
    get_IsVisible: *const anyopaque,
    put_IsVisible: *const anyopaque,
    get_Bounds: *const anyopaque,
    put_Bounds: *const fn (self: *ICoreWebView2Controller, bounds: c.RECT) callconv(c.WINAPI) c.HRESULT,
    get_ZoomFactor: *const anyopaque,
    put_ZoomFactor: *const anyopaque,
    add_ZoomFactorChanged: *const anyopaque,
    remove_ZoomFactorChanged: *const anyopaque,
    SetBoundsAndZoomFactor: *const anyopaque,
    MoveFocus: *const anyopaque,
    add_MoveFocusRequested: *const anyopaque,
    remove_MoveFocusRequested: *const anyopaque,
    add_GotFocus: *const anyopaque,
    remove_GotFocus: *const anyopaque,
    add_LostFocus: *const anyopaque,
    remove_LostFocus: *const anyopaque,
    add_AcceleratorKeyPressed: *const anyopaque,
    remove_AcceleratorKeyPressed: *const anyopaque,
    get_ParentWindow: *const anyopaque,
    put_ParentWindow: *const anyopaque,
    NotifyParentWindowPositionChanged: *const anyopaque,
    Close: *const anyopaque,
    get_CoreWebView2: *const fn (self: *ICoreWebView2Controller, webview: **ICoreWebView2) callconv(c.WINAPI) c.HRESULT,
});

pub const ICoreWebView2 = Object(extern struct {
    get_Settings: *const fn (self: *ICoreWebView2, settings: **ICoreWebView2Settings) callconv(c.WINAPI) c.HRESULT,
    get_Source: *const anyopaque,
    Navigate: *const fn (self: *ICoreWebView2, uri: [*:0]const u16) callconv(c.WINAPI) c.HRESULT,
    NavigateToString: *const anyopaque,
    add_NavigationStarting: *const anyopaque,
    remove_NavigationStarting: *const anyopaque,
    add_ContentLoading: *const anyopaque,
    remove_ContentLoading: *const anyopaque,
    add_SourceChanged: *const anyopaque,
    remove_SourceChanged: *const anyopaque,
    add_HistoryChanged: *const anyopaque,
    remove_HistoryChanged: *const anyopaque,
    add_NavigationCompleted: *const anyopaque,
    remove_NavigationCompleted: *const anyopaque,
    add_FrameNavigationStarting: *const anyopaque,
    remove_FrameNavigationStarting: *const anyopaque,
    add_FrameNavigationCompleted: *const anyopaque,
    remove_FrameNavigationCompleted: *const anyopaque,
    add_ScriptDialogOpening: *const anyopaque,
    remove_ScriptDialogOpening: *const anyopaque,
    add_PermissionRequested: *const anyopaque,
    remove_PermissionRequested: *const anyopaque,
    add_ProcessFailed: *const anyopaque,
    remove_ProcessFailed: *const anyopaque,
    AddScriptToExecuteOnDocumentCreated: *const anyopaque,
    RemoveScriptToExecuteOnDocumentCreated: *const anyopaque,
    ExecuteScript: *const anyopaque,
    CapturePreview: *const anyopaque,
    Reload: *const anyopaque,
    PostWebMessageAsJson: *const anyopaque,
    PostWebMessageAsString: *const anyopaque,
    add_WebMessageReceived: *const anyopaque,
    remove_WebMessageReceived: *const anyopaque,
    CallDevToolsProtocolMethod: *const anyopaque,
    get_BrowserProcessId: *const anyopaque,
    get_CanGoBack: *const anyopaque,
    get_CanGoForward: *const anyopaque,
    GoBack: *const anyopaque,
    GoForward: *const anyopaque,
    GetDevToolsProtocolEventReceiver: *const anyopaque,
    Stop: *const anyopaque,
    add_NewWindowRequested: *const anyopaque,
    remove_NewWindowRequested: *const anyopaque,
    add_DocumentTitleChanged: *const anyopaque,
    remove_DocumentTitleChanged: *const anyopaque,
    get_DocumentTitle: *const anyopaque,
    AddHostObjectToScript: *const anyopaque,
    RemoveHostObjectFromScript: *const anyopaque,
    OpenDevToolsWindow: *const anyopaque,
    add_ContainsFullScreenElementChanged: *const anyopaque,
    remove_ContainsFullScreenElementChanged: *const anyopaque,
    get_ContainsFullScreenElement: *const anyopaque,
    add_WebResourceRequested: *const anyopaque,
    remove_WebResourceRequested: *const anyopaque,
    AddWebResourceRequestedFilter: *const anyopaque,
    RemoveWebResourceRequestedFilter: *const anyopaque,
    add_WindowCloseRequested: *const anyopaque,
    remove_WindowCloseRequested: *const anyopaque,
});

pub const ICoreWebView2Settings = Object(extern struct {
    get_IsScriptEnabled: *const anyopaque,
    put_IsScriptEnabled: *const anyopaque,
    get_IsWebMessageEnabled: *const anyopaque,
    put_IsWebMessageEnabled: *const anyopaque,
    get_AreDefaultScriptDialogsEnabled: *const anyopaque,
    put_AreDefaultScriptDialogsEnabled: *const anyopaque,
    get_IsStatusBarEnabled: *const anyopaque,
    put_IsStatusBarEnabled: *const anyopaque,
    get_AreDevToolsEnabled: *const anyopaque,
    put_AreDevToolsEnabled: *const fn (self: *ICoreWebView2Settings, value: c.BOOL) callconv(c.WINAPI) c.HRESULT,
    get_AreDefaultContextMenusEnabled: *const anyopaque,
    put_AreDefaultContextMenusEnabled: *const anyopaque,
    get_AreHostObjectsAllowed: *const anyopaque,
    put_AreHostObjectsAllowed: *const anyopaque,
    get_IsZoomControlEnabled: *const anyopaque,
    put_IsZoomControlEnabled: *const anyopaque,
    get_IsBuiltInErrorPageEnabled: *const anyopaque,
    put_IsBuiltInErrorPageEnabled: *const anyopaque,
});

pub fn Object(comptime T: type) type {
    return extern struct {
        const Self = @This();

        pub const VTable = extern struct {
            QueryInterface: *const anyopaque,
            AddRef: *const fn (self: *Self) callconv(c.WINAPI) c.ULONG,
            Release: *const fn (self: *Self) callconv(c.WINAPI) c.ULONG,
            inner: T,
        };

        vtable: *const VTable,

        pub fn AddRef(self: *Self) c.ULONG {
            return self.vtable.AddRef(self);
        }

        pub fn Release(self: *Self) c.ULONG {
            return self.vtable.Release(self);
        }

        pub fn call(self: *Self, comptime fun: @TypeOf(.EnumLiteral), args: anytype) c.HRESULT {
            const res: c.HRESULT = @call(.auto, @field(self.vtable.inner, @tagName(fun)), .{self} ++ args);

            if (res != c.S_OK) {
                std.log.err("Failed to call COM function {s} with error {d}\n", .{ @tagName(fun), res });
                return res;
            }

            return res;
        }
    };
}

pub fn Callback(comptime T: type, comptime F: @TypeOf(@as(T, undefined).vtable.inner.Invoke)) *T {
    // I think this might be enough, because we only support "static" callbacks
    const Helper = struct {
        var STATIC: T = .{
            .vtable = &.{
                .QueryInterface = QueryInterface,
                .AddRef = AddRef,
                .Release = Release,
                .inner = .{ .Invoke = F },
            },
        };

        pub fn QueryInterface(_: *anyopaque, _: *const c.GUID, _: **anyopaque) callconv(c.WINAPI) c.HRESULT {
            return c.S_OK;
        }

        pub fn AddRef(_: *T) callconv(c.WINAPI) c.ULONG {
            return 1;
        }

        pub fn Release(_: *T) callconv(c.WINAPI) c.ULONG {
            return 1;
        }
    };

    return &Helper.STATIC;
}

extern "ole32" fn CoCreateInstance(rclsid: ?*const c.GUID, pUnkOuter: ?*anyopaque, dwClsContext: c.DWORD, riid: ?*const c.GUID, ppv: **anyopaque) callconv(c.WINAPI) c.HRESULT;
