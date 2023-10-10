const std = @import("std");

pub fn create(b: *std.Build, target: std.zig.CrossTarget, optimize: std.builtin.Mode) *std.build.Step {
    const exe = b.addExecutable(.{
        .name = b.fmt("ava_{s}", .{@tagName(target.getCpuArch())}),
        .target = target,
        .optimize = optimize,
    });

    exe.subsystem = .Windows;

    // mkdir -p webview2
    // curl -sSL "https://www.nuget.org/api/v2/package/Microsoft.Web.WebView2" | tar -xf - -C webview2
    // TODO: linux
    exe.linkLibCpp();
    exe.addIncludePath(.{ .path = "../webview2/build/native/include" });
    exe.addLibraryPath(.{ .path = "../webview2/build/native/x64" });
    exe.linkSystemLibrary("WebView2Loader.dll");
    exe.addCSourceFiles(&.{"src/windows/winmain.cpp"}, &.{"-std=c++17"});

    b.installArtifact(exe);

    return &exe.step;
}
