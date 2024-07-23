const std = @import("std");

pub fn build(b: *std.Build) !void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    // const headless = b.option(bool, "headless", "Build headless webserver") orelse false;

    const exe = b.addExecutable(.{
        .name = "ava",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,

        // For some reason, linux binaries are huge. Strip them in release mode.
        .strip = optimize != .Debug,
    });

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

    try addLlama(b, exe);

    const suffix = if (exe.rootModuleTarget().os.tag == .windows) ".exe" else "";
    const bin = b.addInstallBinFile(exe.getEmittedBin(), b.fmt("ava_{s}{s}", .{ @tagName(exe.rootModuleTarget().cpu.arch), suffix }));
    b.getInstallStep().dependOn(&bin.step);
}

fn addLlama(b: *std.Build, exe: anytype) !void {
    exe.addIncludePath(b.path("llama.cpp/ggml/include"));
    exe.addIncludePath(b.path("llama.cpp/include"));

    const cflags = try flags(b, exe, &.{"-std=c11"});
    const cxxflags = try flags(b, exe, &.{"-std=c++11"});

    const sources: []const []const u8 = &.{
        "ggml/src/ggml.c",
        "ggml/src/ggml-aarch64.c",
        "ggml/src/ggml-alloc.c",
        "ggml/src/ggml-backend.c",
        "ggml/src/ggml-quants.c",
        "ggml/src/ggml-metal.m",
        "src/llama.cpp",
        "src/llama-grammar.cpp",
        "src/llama-sampling.cpp",
        "src/llama-vocab.cpp",
        "src/unicode.cpp",
        "src/unicode-data.cpp",
    };

    for (sources) |f| {
        const is_cpp = std.mem.endsWith(u8, f, ".cpp");
        if (std.mem.endsWith(u8, f, ".m") and exe.rootModuleTarget().os.tag != .macos) continue;

        const o = b.addObject(.{
            .name = std.fs.path.basename(f),
            .target = exe.root_module.resolved_target.?,
            .optimize = .ReleaseFast, // always optimize llama.cpp
        });

        o.defineCMacro("_GNU_SOURCE", null);
        o.addIncludePath(b.path("llama.cpp/ggml/include"));
        o.addIncludePath(b.path("llama.cpp/include"));
        o.addCSourceFile(.{ .file = b.path(b.pathJoin(&.{ "llama.cpp", f })), .flags = if (is_cpp) cxxflags else cflags });
        if (is_cpp) o.linkLibCpp() else o.linkLibC();
        exe.addObject(o);
    }

    if (exe.rootModuleTarget().os.tag == .macos) {
        exe.linkFramework("Foundation");
        exe.linkFramework("Metal");
        exe.linkFramework("MetalKit");

        // Copy the Metal shader file and the common header file to the output directory so that it can be found at runtime.
        const copy_common_step = b.addInstallBinFile(b.path("llama.cpp/ggml/src/ggml-common.h"), "ggml-common.h");
        b.getInstallStep().dependOn(&copy_common_step.step);
        const copy_metal_step = b.addInstallBinFile(b.path("llama.cpp/ggml/src/ggml-metal.metal"), "ggml-metal.metal");
        b.getInstallStep().dependOn(&copy_metal_step.step);
    }
}

fn flags(b: *std.Build, exe: anytype, prefix: []const []const u8) ![]const []const u8 {
    var res = std.ArrayList([]const u8).init(b.allocator);
    try res.appendSlice(prefix);
    try res.appendSlice(&.{ "-fPIC", "-Ofast", "-ffast-math", "-fno-finite-math-only", "-DNDEBUG", "-DGGML_USE_K_QUANTS", "-DGGML_NO_LLAMAFILE" });

    if (exe.rootModuleTarget().os.tag == .macos) {
        try res.appendSlice(&.{ "-DGGML_USE_METAL", "-DGGML_METAL_NDEBUG" });
    }

    return res.items;
}
