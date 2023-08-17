extern fn _runWebView(url: [*:0]const u8) void;

pub fn runWebView(url: [*:0]const u8) void {
    _runWebView(url);
}
