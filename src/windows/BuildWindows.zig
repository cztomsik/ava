const std = @import("std");

pub const Options = struct {
    name: []const u8,
    root_source_file: std.Build.LazyPath,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
};

pub fn create(owner: *std.Build, options: Options) *std.Build.Step.Compile {
    const download_deps = owner.addSystemCommand(&.{ "bash", "src/windows/download_deps.sh" });
    download_deps.has_side_effects = true;

    const exe = owner.addExecutable(.{
        .name = options.name,
        .target = options.target,
        .optimize = options.optimize,
        .root_source_file = options.root_source_file,
        .win32_manifest = .{ .path = "src/windows/winmain.manifest" },
    });

    if (options.optimize != .Debug) {
        exe.subsystem = .Windows;
    }

    exe.addIncludePath(.{ .path = "include" });
    exe.linkSystemLibrary("ole32");
    exe.linkSystemLibrary("ws2_32");
    exe.linkSystemLibrary("crypt32");

    exe.addLibraryPath(.{ .path = "zig-out/webview2_loader/x64" });
    exe.linkSystemLibrary("WebView2Loader.dll");

    exe.step.dependOn(&download_deps.step);

    return exe;
}
