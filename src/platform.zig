const std = @import("std");
const builtin = @import("builtin");

pub fn getHome() [*:0]const u8 {
    return std.os.getenv("HOME") orelse ".";
}

pub fn runWebView(url: [*:0]const u8) void {
    _runWebView(url, builtin.mode == .Debug);
}

extern fn _runWebView(url: [*:0]const u8, debug: bool) void;
