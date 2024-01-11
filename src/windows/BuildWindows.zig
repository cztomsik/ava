const std = @import("std");
const root = @import("../../build.zig");

pub fn create(b: *std.Build) !*std.Build.Step {
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
    sqlite.addCSourceFiles(.{ .files = &.{"zig-out/sqlite/sqlite3.c"}, .flags = &.{"-std=c99"} });

    const exe = b.addExecutable(.{
        .name = b.fmt("ava_{s}", .{@tagName(root.target.result.cpu.arch)}),
        .target = root.target,
        .optimize = root.optimize,
        .root_source_file = .{ .path = "src/windows/winmain.zig" },
        .win32_manifest = .{ .path = "src/windows/winmain.manifest" },
    });

    if (root.optimize != .Debug) {
        exe.subsystem = .Windows;
    }

    exe.addIncludePath(.{ .path = "include" });
    exe.linkLibrary(sqlite);
    exe.linkLibrary(root.llama);
    exe.linkLibrary(root.srv);
    exe.linkSystemLibrary("ole32");
    exe.linkSystemLibrary("ws2_32");
    exe.linkSystemLibrary("crypt32");

    exe.addLibraryPath(.{ .path = "zig-out/webview2_loader/x64" });
    exe.linkSystemLibrary("WebView2Loader.dll");

    b.installArtifact(exe);

    exe.step.dependOn(&download_deps.step);
    exe.step.dependOn(&sqlite.step);

    return &exe.step;
}
