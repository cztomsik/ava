const std = @import("std");
const root = @import("../../build.zig");

pub fn create(b: *std.Build) !*std.build.Step {
    const download_deps = b.addSystemCommand(&.{ "bash", "src/windows/download_deps.sh" });
    download_deps.has_side_effects = true;

    // Otherwise the @cImport() in sqlite.zig would fail
    std.log.debug("Adding sqlite include path to the server task", .{});
    root.srv.addIncludePath(.{ .path = "zig-out/sqlite" });
    root.srv.step.dependOn(&download_deps.step);

    const sqlite = b.addStaticLibrary(.{
        .name = "sqlite",
        .target = root.target,
        .optimize = if (root.optimize == .Debug) .Debug else .ReleaseSmall,
    });
    sqlite.step.dependOn(&download_deps.step);
    sqlite.linkLibC();
    sqlite.addCSourceFiles(&.{"zig-out/sqlite/sqlite3.c"}, &.{"-std=c99"});

    const exe = b.addExecutable(.{
        .name = b.fmt("ava_{s}", .{@tagName(root.target.getCpuArch())}),
        .target = root.target,
        .optimize = .Debug, // Otherwise it just fails, no idea what's the problem there...
    });

    // exe.subsystem = .Windows;
    exe.want_lto = false; // Otherwise link will fail
    exe.linkLibCpp();
    exe.addIncludePath(.{ .path = "include" });
    exe.linkLibrary(sqlite);
    exe.linkLibrary(root.llama);
    exe.linkLibrary(root.srv);
    exe.linkSystemLibrary("ole32");
    exe.linkSystemLibrary("ws2_32");
    exe.linkSystemLibrary("crypt32");

    exe.addIncludePath(.{ .path = "zig-out/webview2_loader/include" });
    exe.addLibraryPath(.{ .path = "zig-out/webview2_loader/x64" });
    exe.linkSystemLibrary("WebView2Loader.dll");

    exe.addCSourceFiles(&.{"src/windows/winmain.cpp"}, &.{"-std=c++11"});
    b.installArtifact(exe);

    exe.step.dependOn(&download_deps.step);
    exe.step.dependOn(&sqlite.step);

    return &exe.step;
}
