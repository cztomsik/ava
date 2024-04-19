const std = @import("std");

pub fn build(b: *std.Build) !void {
    // const target_query = b.standardTargetOptionsQueryOnly(.{});
    // if (target.query.os_tag == .macos and target.query.os_version_min == null) {
    //     target.query.os_version_min = .{ .semver = try std.SemanticVersion.parse("12.6.0") };
    //     std.log.debug("Setting macOS deployment target to {}", .{target.query.os_version_min.?});
    // }

    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const headless = b.option(bool, "headless", "Build headless webserver") orelse false;

    const options = .{
        .name = "ava",
        .root_source_file = .{ .path = if (headless) "_headless.zig" else "_gui.zig" },
        .target = target,
        .optimize = optimize,

        // For some reason, linux binaries are huge. Strip them in release mode.
        .strip = optimize != .Debug,
    };

    if (headless) {
        try buildExe(b, b.addExecutable(options));
    } else switch (target.result.os.tag) {
        .macos => try buildExe(b, @import("src/macos/BuildMacos.zig").create(b, options)),
        .windows => try buildExe(b, @import("src/windows/BuildWindows.zig").create(b, options)),
        else => return error.UnsupportedOs,
    }
}

fn buildExe(b: *std.Build, exe: anytype) !void {
    exe.addIncludePath(.{ .path = "llama.cpp" });

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
    if (@hasField(@TypeOf(exe.*), "sdk")) fridge.module("fridge").addSystemIncludePath(.{ .path = b.fmt("{s}/usr/include", .{exe.sdk}) });

    try addLlama(b, exe);

    const suffix = if (exe.rootModuleTarget().os.tag == .windows) ".exe" else "";
    const bin = b.addInstallBinFile(exe.getEmittedBin(), b.fmt("ava_{s}{s}", .{ @tagName(exe.rootModuleTarget().cpu.arch), suffix }));
    b.getInstallStep().dependOn(&bin.step);
}

fn addLlama(b: *std.Build, exe: anytype) !void {
    const cflags = try flags(b, exe, &.{"-std=c11"});
    const cxxflags = try flags(b, exe, &.{"-std=c++11"});

    const sources: []const []const u8 = &.{
        "ggml.c",
        "ggml-alloc.c",
        "ggml-backend.c",
        "ggml-quants.c",
        "ggml-metal.m",
        "unicode.cpp",
        "unicode-data.cpp",
        "llama.cpp",
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
        o.addIncludePath(.{ .path = "llama.cpp" });
        o.addCSourceFile(.{ .file = .{ .path = b.pathJoin(&.{ "llama.cpp", f }) }, .flags = if (is_cpp) cxxflags else cflags });
        if (is_cpp) o.linkLibCpp() else o.linkLibC();
        if (@hasField(@TypeOf(exe.*), "sdk")) exe.applySDK(o);
        exe.addObject(o);
    }

    if (exe.rootModuleTarget().os.tag == .macos) {
        exe.linkFramework("Foundation");
        exe.linkFramework("Metal");
        exe.linkFramework("MetalKit");

        // Copy the Metal shader file and the common header file to the output directory so that it can be found at runtime.
        const copy_common_step = b.addInstallBinFile(.{ .path = "llama.cpp/ggml-common.h" }, "ggml-common.h");
        b.getInstallStep().dependOn(&copy_common_step.step);
        const copy_metal_step = b.addInstallBinFile(.{ .path = "llama.cpp/ggml-metal.metal" }, "ggml-metal.metal");
        b.getInstallStep().dependOn(&copy_metal_step.step);
    }
}

fn flags(b: *std.Build, exe: anytype, prefix: []const []const u8) ![]const []const u8 {
    var res = std.ArrayList([]const u8).init(b.allocator);
    try res.appendSlice(prefix);
    try res.appendSlice(&.{ "-fPIC", "-Ofast", "-DNDEBUG", "-DGGML_USE_K_QUANTS" });

    if (exe.rootModuleTarget().os.tag == .macos) {
        try res.appendSlice(&.{ "-DGGML_USE_METAL", "-DGGML_METAL_NDEBUG" });
    }

    return res.items;
}
