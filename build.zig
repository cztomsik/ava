const std = @import("std");
const tokamak = @import("tokamak");

pub fn build(b: *std.Build) !void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const headless = b.option(bool, "headless", "Build headless webserver") orelse false;

    const exe = b.addExecutable(.{
        .name = "ava",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/main.zig"),
            .target = target,
            .optimize = optimize,

            // For some reason, linux binaries are huge. Strip them in release mode.
            .strip = optimize != .Debug,
        }),
    });
    b.installArtifact(exe);

    tokamak.setup(exe, .{
        .embed = &.{
            "LICENSE.md",
            "src/app/index.html",
            "src/app/favicon.ico",
            "zig-out/app/index.css",
            "zig-out/app/index.js",
        },
    });

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
    exe.addIncludePath(webview.path("core/include"));
    exe.addCSourceFile(.{ .file = webview.path("core/src/webview.cc"), .flags = &.{ "-std=c++14", "-DWEBVIEW_STATIC" } });

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
    const bin_path = bin.path(switch (target.result.os.tag) {
        .windows => ".",
        else => "llama-b7772",
    });

    // Link libraries directly from the dependency to avoid conflicts with system-installed versions
    const libs: []const []const u8 = switch (target.result.os.tag) {
        .windows => &.{ "llama.dll", "ggml.dll", "ggml-base.dll", "ggml-cpu-x64.dll" },
        .macos => &.{ "libllama.0.dylib", "libggml.0.dylib", "libggml-base.0.dylib", "libggml-cpu.0.dylib", "libggml-metal.0.dylib", "libggml-blas.0.dylib", "libggml-rpc.0.dylib" },
        else => &.{ "libllama.so", "libggml.so", "libggml-base.so", "libggml-cpu-x64.so" },
    };
    for (libs) |lib| {
        exe.addObjectFile(bin_path.path(b, lib));
        b.getInstallStep().dependOn(&b.addInstallBinFile(bin_path.path(b, lib), lib).step);
    }

    // Add RPATH so the executable can find the libraries at runtime
    exe.addRPath(.{ .cwd_relative = "@executable_path" });

    exe.root_module.addImport("llama_cpp", llama_cpp.createModule());
}
