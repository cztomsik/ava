const std = @import("std");
const root = @import("../../build.zig");

pub fn create(b: *std.Build) !*std.Build.Step {
    useMacSDK(b, root.llama);
    useMacSDK(b, root.srv);

    const swiftc = b.addSystemCommand(&.{
        "swiftc",
        if (root.optimize == .Debug) "-Onone" else "-O",
        "-import-objc-header",
        "include/ava.h",
        "-L",
        "zig-out/lib",
        "-lava_server",
        "-lllama",
        "-lsqlite3",
        "-target",
        b.fmt("{s}-apple-macosx{}", .{ @tagName(root.target.getCpuArch()), root.target.os_version_min.?.semver }),
        "-o",
        b.fmt("zig-out/bin/ava_{s}", .{@tagName(root.target.getCpuArch())}),
    });

    if (root.optimize == .Debug) {
        swiftc.addArgs(&.{ "-D", "DEBUG" });
    }

    swiftc.addFileArg(.{ .path = "src/macos/entry.swift" });
    swiftc.addFileArg(.{ .path = "src/macos/webview.swift" });

    return &swiftc.step;
}

fn useMacSDK(b: *std.Build, step: *std.Build.Step.Compile) void {
    const macos_sdk = std.mem.trimRight(u8, b.run(&.{ "xcrun", "--show-sdk-path" }), "\n");

    std.log.debug("Using macOS SDK {s} for step {s}", .{ macos_sdk, step.name });

    step.addSystemIncludePath(.{ .path = b.fmt("{s}/usr/include", .{macos_sdk}) });
    step.addFrameworkPath(.{ .path = b.fmt("{s}/System/Library/Frameworks", .{macos_sdk}) });
    step.addLibraryPath(.{ .path = b.fmt("{s}/usr/lib", .{macos_sdk}) });
}
