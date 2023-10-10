const std = @import("std");

pub fn create(b: *std.Build, target: std.zig.CrossTarget, optimize: std.builtin.Mode) *std.Build.Step {
    const swiftc = b.addSystemCommand(&.{
        "swiftc",
        if (optimize == .Debug) "-Onone" else "-O",
        "-import-objc-header",
        "include/ava.h",
        "-L",
        "zig-out/lib",
        "-lava_server",
        "-lllama",
        "-lsqlite3",
        "-target",
        b.fmt("{s}-apple-macosx{}", .{ @tagName(target.getCpuArch()), target.os_version_min.?.semver }),
        "-o",
        b.fmt("zig-out/bin/ava_{s}", .{@tagName(target.getCpuArch())}),
    });

    if (optimize == .Debug) {
        swiftc.addArgs(&.{ "-D", "DEBUG" });
    }

    swiftc.addFileArg(.{ .path = "src/macos/entry.swift" });
    swiftc.addFileArg(.{ .path = "src/macos/webview.swift" });

    return &swiftc.step;
}
