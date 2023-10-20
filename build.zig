const std = @import("std");

pub var target: std.zig.CrossTarget = undefined;
pub var optimize: std.builtin.Mode = undefined;
pub var llama: *std.Build.Step.Compile = undefined;
pub var srv: *std.Build.Step.Compile = undefined;

pub fn build(b: *std.Build) !void {
    target = b.standardTargetOptions(.{});
    optimize = b.standardOptimizeOption(.{});

    if (target.getOsTag() == .macos and target.os_version_min == null) {
        target.os_version_min = .{ .semver = try std.SemanticVersion.parse("12.6.0") };
        std.log.debug("Setting macOS deployment target to {}", .{target.os_version_min.?});
    }

    try addLlama(b);
    try addServer(b);

    const exe = try switch (target.getOsTag()) {
        .windows => @import("src/windows/BuildWindows.zig").create(b),
        .macos => @import("src/macos/BuildMacOS.zig").create(b),
        else => error.UnsupportedOs,
    };

    exe.dependOn(&llama.step);
    exe.dependOn(&srv.step);

    b.getInstallStep().dependOn(exe);
}

fn addServer(b: *std.Build) !void {
    srv = b.addStaticLibrary(.{
        .name = "ava_server",
        .root_source_file = .{ .path = "src/main.zig" },
        .target = target,
        .optimize = optimize,
    });
    srv.linkLibC();
    srv.bundle_compiler_rt = true; // needed for everything
    srv.main_mod_path = .{ .path = "." }; // needed for @embedFile
    srv.addIncludePath(.{ .path = "llama.cpp" }); // needed for @cImport

    b.installArtifact(srv);
}

fn addLlama(b: *std.Build) !void {
    llama = b.addStaticLibrary(.{
        .name = "llama",
        .target = target,
        .optimize = .ReleaseFast, // otherwise it's too slow
    });

    var cflags = std.ArrayList([]const u8).init(b.allocator);
    try cflags.append("-std=c11");

    var cxxflags = std.ArrayList([]const u8).init(b.allocator);
    try cxxflags.append("-std=c++11");

    // https://github.com/ziglang/zig/issues/15448
    if (target.getAbi() == .msvc) llama.linkLibC() else llama.linkLibCpp();

    // shared
    try cflags.appendSlice(&.{ "-Ofast", "-DNDEBUG", "-DGGML_USE_K_QUANTS" });
    try cxxflags.appendSlice(&.{ "-Ofast", "-DNDEBUG" });

    if (target.getOsTag() == .windows) {
        if (target.getAbi() != .msvc) llama.defineCMacro("_GNU_SOURCE", null);
    } else {
        try cflags.append("-fPIC");
        try cxxflags.append("-fPIC");
    }

    // Use Metal on macOS
    if (target.getOsTag() == .macos) {
        // Looks like this is still needed
        try cflags.appendSlice(&.{ "-DGGML_USE_METAL", "-DGGML_METAL_NDEBUG" });
        try cxxflags.appendSlice(&.{ "-DGGML_USE_METAL", "-DGGML_METAL_NDEBUG" });

        llama.addCSourceFiles(.{ .files = &.{"llama.cpp/ggml-metal.m"}, .flags = cflags.items });

        // Copy the *.metal file so that it can be loaded at runtime
        const copy_metal_step = b.addInstallBinFile(.{ .path = "llama.cpp/ggml-metal.metal" }, "ggml-metal.metal");
        b.getInstallStep().dependOn(&copy_metal_step.step);
    }

    llama.addIncludePath(.{ .path = "llama.cpp" });
    llama.addCSourceFiles(.{ .files = &.{ "llama.cpp/ggml.c", "llama.cpp/ggml-alloc.c", "llama.cpp/ggml-backend.c", "llama.cpp/k_quants.c" }, .flags = cflags.items });
    llama.addCSourceFiles(.{ .files = &.{"llama.cpp/llama.cpp"}, .flags = cxxflags.items });
    b.installArtifact(llama);
}
