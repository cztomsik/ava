const std = @import("std");

pub fn build(b: *std.Build) !void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const headless = b.option(bool, "headless", "Build headless webserver") orelse false;

    const exe = b.addExecutable(.{
        .name = "ava",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,

        // For some reason, linux binaries are huge. Strip them in release mode.
        .strip = optimize != .Debug,
    });
    b.installArtifact(exe);

    const embed: []const []const u8 = &.{
        "LICENSE.md",
        "src/app/index.html",
        "src/app/favicon.ico",
        "zig-out/app/main.js",
    };

    const tokamak = b.dependency("tokamak", .{ .embed = embed });
    exe.root_module.addImport("tokamak", tokamak.module("tokamak"));

    const fridge = b.dependency("fridge", .{ .bundle = exe.rootModuleTarget().os.tag != .macos });
    exe.root_module.addImport("fridge", fridge.module("fridge"));

    const options = b.addOptions();
    options.addOption(bool, "headless", headless);
    exe.root_module.addOptions("options", options);

    if (!headless) {
        try addWebview(b, exe);
    }

    try addLlama(b, exe);

    const run_cmd = b.addRunArtifact(exe);
    run_cmd.step.dependOn(b.getInstallStep());
    const run_step = b.step("run", "Run the app");
    run_step.dependOn(&run_cmd.step);
}

fn addWebview(b: *std.Build, exe: anytype) !void {
    const webview = b.dependency("webview", .{});
    exe.linkLibCpp();
    exe.addIncludePath(webview.path(""));
    exe.addCSourceFile(.{ .file = webview.path("webview.cc"), .flags = &.{ "-std=c++14", "-DWEBVIEW_STATIC" } });

    switch (exe.rootModuleTarget().os.tag) {
        .macos => exe.linkFramework("WebKit"),
        .linux => {
            exe.linkSystemLibrary("gtk+-3.0");
            exe.linkSystemLibrary("webkit2gtk-4.1");
        },
        .windows => {
            exe.linkSystemLibrary("ole32");
            exe.linkSystemLibrary("version");
            exe.linkSystemLibrary("shlwapi");
        },
        else => {},
    }
}

fn addLlama(b: *std.Build, exe: anytype) !void {
    const target = exe.root_module.resolved_target.?;
    const dep = b.dependency("llama_cpp", .{});

    const llama_cpp = b.addTranslateC(.{
        .root_source_file = dep.path("include/llama.h"),
        .target = target,
        .optimize = .ReleaseFast,
        .link_libc = true,
    });

    llama_cpp.addIncludePath(dep.path("include"));
    llama_cpp.addIncludePath(dep.path("ggml/include"));

    const bin = b.dependency(b.fmt("llama_cpp_{s}", .{@tagName(target.result.os.tag)}), .{});
    exe.addLibraryPath(bin.path(switch (target.result.os.tag) {
        .windows => ".",
        else => "bin",
    }));
    exe.linkSystemLibrary("llama");

    exe.root_module.addImport("llama_cpp", llama_cpp.createModule());
}
