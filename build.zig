const std = @import("std");

var b: *std.Build = undefined;
var target: std.zig.CrossTarget = undefined;
var optimize: std.builtin.Mode = undefined;

pub fn build(builder: *std.Build) !void {
    b = builder;
    target = b.standardTargetOptions(.{});
    optimize = b.standardOptimizeOption(.{});

    if (target.getOsTag() == .macos and target.os_version_min == null) {
        target.os_version_min = .{ .semver = try std.SemanticVersion.parse("12.6.0") };
        std.log.debug("Setting macOS deployment target to {}", .{target.os_version_min.?});
    }

    const llama = try addLlama();
    const srv = try addServer(llama);
    const exe = try addExe(srv);

    b.getInstallStep().dependOn(&exe.step);
}

fn addExe(srv: *std.Build.Step.Compile) !*std.Build.Step.Run {
    // TODO: windows, linux

    const swiftc = b.addSystemCommand(&.{
        "swiftc",
        if (optimize == .ReleaseFast) "-O" else "-Onone",
        "-import-objc-header",
        "src/macos/ava.h",
        "-L",
        "zig-out/lib",
        "-lava_server",
        "-lllama",
        "-lsqlite3",
        "-target",
        b.fmt("{s}-apple-macosx{}", .{ @tagName(target.getCpuArch()), target.os_version_min.?.semver }),
        "-o",
        b.fmt("zig-out/bin/ava_{s}", .{@tagName(target.getCpuArch())}),
    });

    swiftc.addFileArg(.{ .path = "src/macos/entry.swift" });
    swiftc.addFileArg(.{ .path = "src/macos/content.swift" });
    swiftc.step.dependOn(&srv.step);

    return swiftc;
}

fn addServer(llama: *std.Build.Step.Compile) !*std.Build.Step.Compile {
    const srv = b.addStaticLibrary(.{
        .name = "ava_server",
        .root_source_file = .{ .path = "src/main.zig" },
        .target = target,
        .optimize = optimize,
    });
    srv.bundle_compiler_rt = true; // needed for everything
    srv.main_pkg_path = .{ .path = "." }; // needed for @embedFile
    srv.addIncludePath(.{ .path = "llama.cpp" }); // needed for @cImport

    if (target.getOsTag() == .macos) {
        useMacSDK(srv);
        srv.linkSystemLibrary("sqlite3");
    }

    srv.linkLibrary(llama);
    b.installArtifact(srv);

    return srv;
}

fn addLlama() !*std.Build.Step.Compile {
    const llama = b.addStaticLibrary(.{
        .name = "llama",
        .target = target,
        .optimize = .ReleaseFast, // otherwise it's too slow
    });

    var cflags = std.ArrayList([]const u8).init(b.allocator);
    try cflags.append("-std=c11");
    llama.linkLibC();

    var cxxflags = std.ArrayList([]const u8).init(b.allocator);
    try cxxflags.append("-std=c++11");
    llama.linkLibCpp();

    // shared
    try cflags.appendSlice(&.{ "-Ofast", "-fPIC", "-DNDEBUG", "-DGGML_USE_K_QUANTS" });
    try cxxflags.appendSlice(&.{ "-Ofast", "-fPIC", "-DNDEBUG" });

    // TODO: windows
    if (target.getOsTag() != .windows) {}

    // Use Metal on macOS
    if (target.getOsTag() == .macos) {
        useMacSDK(llama);

        try cflags.appendSlice(&.{ "-DGGML_USE_METAL", "-DGGML_METAL_NDEBUG" });
        try cxxflags.appendSlice(&.{ "-DGGML_USE_METAL", "-DGGML_METAL_NDEBUG" });

        llama.addCSourceFiles(&.{"llama.cpp/ggml-metal.m"}, cflags.items);
        llama.linkFramework("Foundation");
        llama.linkFramework("Metal");
        llama.linkFramework("MetalKit");
        llama.linkFramework("MetalPerformanceShaders");

        // Copy the *.metal file so that it can be loaded at runtime
        const copy_metal_step = b.addInstallBinFile(.{ .path = "llama.cpp/ggml-metal.metal" }, "ggml-metal.metal");
        b.getInstallStep().dependOn(&copy_metal_step.step);
    }

    llama.addIncludePath(.{ .path = "llama.cpp" });
    llama.addCSourceFiles(&.{ "llama.cpp/ggml.c", "llama.cpp/ggml-alloc.c", "llama.cpp/k_quants.c" }, cflags.items);
    llama.addCSourceFiles(&.{"llama.cpp/llama.cpp"}, cxxflags.items);
    b.installArtifact(llama);

    return llama;
}

fn useMacSDK(step: *std.Build.Step.Compile) void {
    const macos_sdk = std.mem.trimRight(u8, b.exec(&.{ "xcrun", "--show-sdk-path" }), "\n");

    step.addSystemIncludePath(.{ .path = b.fmt("{s}/usr/include", .{macos_sdk}) });
    step.addFrameworkPath(.{ .path = b.fmt("{s}/System/Library/Frameworks", .{macos_sdk}) });
    step.addLibraryPath(.{ .path = b.fmt("{s}/usr/lib", .{macos_sdk}) });
}
