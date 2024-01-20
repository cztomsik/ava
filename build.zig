const std = @import("std");

pub fn build(b: *std.Build) !void {
    // const target_query = b.standardTargetOptionsQueryOnly(.{});
    // if (target.query.os_tag == .macos and target.query.os_version_min == null) {
    //     target.query.os_version_min = .{ .semver = try std.SemanticVersion.parse("12.6.0") };
    //     std.log.debug("Setting macOS deployment target to {}", .{target.query.os_version_min.?});
    // }

    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const exe = if (b.option(bool, "headless", "Build headless webserver") orelse false) b.addExecutable(.{
        .name = "ava",
        .root_source_file = .{ .path = "src/main.zig" },
        .target = target,
        .optimize = optimize,
    }) else switch (target.result.os.tag) {
        else => return error.UnsupportedOs,
    };
    exe.addIncludePath(.{ .path = "llama.cpp" });

    const sqlite = b.dependency("ava-sqlite", .{ .bundle = true });
    exe.root_module.addImport("ava-sqlite", sqlite.module("ava-sqlite"));

    try generateBuildInfo();
    try addLlama(b, exe);

    b.installArtifact(exe);
}

fn generateBuildInfo() !void {
    // TODO: later
    try std.fs.cwd().writeFile("llama.cpp/common/build-info.cpp",
        \\int LLAMA_BUILD_NUMBER = 0;
        \\char const *LLAMA_COMMIT = "";
        \\char const *LLAMA_COMPILER = "";
        \\char const *LLAMA_BUILD_TARGET = "";
    );
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
        "llama.cpp",
        "common/build-info.cpp",
        "common/common.cpp",
        "common/console.cpp",
        "common/sampling.cpp",
        "common/grammar-parser.cpp",
    };

    for (sources) |f| {
        const is_cpp = std.mem.endsWith(u8, f, ".cpp");
        if (std.mem.endsWith(u8, f, ".cpp") and exe.rootModuleTarget().os.tag != .macos) continue;

        const o = b.addObject(.{
            .name = std.fs.path.basename(f),
            .target = exe.root_module.resolved_target.?,
            .optimize = exe.root_module.optimize.?,
        });

        o.defineCMacro("_GNU_SOURCE", null);
        o.addIncludePath(.{ .path = "llama.cpp" });
        o.addCSourceFile(.{ .file = .{ .path = b.pathJoin(&.{ "llama.cpp", f }) }, .flags = if (is_cpp) cxxflags else cflags });
        if (is_cpp) o.linkLibCpp() else o.linkLibC();
        exe.addObject(o);
    }

    if (exe.rootModuleTarget().os.tag == .macos) {
        exe.linkFramework("Foundation");
        exe.linkFramework("Metal");
        exe.linkFramework("MetalKit");

        // Copy the *.metal file so that it can be loaded at runtime
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
