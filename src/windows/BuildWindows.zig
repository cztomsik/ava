const std = @import("std");
const root = @import("../../build.zig");

pub fn create(b: *std.Build) !*std.build.Step {
    const download_deps = b.addSystemCommand(&.{ "bash", "src/windows/download_deps.sh" });
    download_deps.has_side_effects = true;

    const exe = b.addExecutable(.{
        .name = b.fmt("ava_{s}", .{@tagName(root.target.getCpuArch())}),
        .target = root.target,
        .optimize = root.optimize,
    });

    exe.subsystem = .Windows;
    exe.linkLibCpp();
    exe.addIncludePath(.{ .path = "zig-out/webview2_loader/include" });
    exe.addLibraryPath(.{ .path = "zig-out/webview2_loader/x64" });
    exe.linkSystemLibrary("WebView2Loader.dll");
    exe.addCSourceFiles(&.{"src/windows/winmain.cpp"}, &.{"-std=c++11"});

    b.installArtifact(exe);

    std.log.debug("Adding sqlite include path to the server task", .{});
    root.srv.addIncludePath(.{ .path = "zig-out/sqlite" });
    root.srv.step.dependOn(&download_deps.step);

    exe.step.dependOn(&download_deps.step);

    return &exe.step;
}
