const std = @import("std");
const root = @import("../../build.zig");
const BuildMacos = @This();

pub const Options = struct {
    name: []const u8,
    root_source_file: std.Build.LazyPath,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
};

owner: *std.Build,
object: *std.Build.Step.Compile,
root_module: *std.Build.Module,
swiftc: *std.Build.Step.Run,
out: std.Build.LazyPath,

pub fn create(
    owner: *std.Build,
    options: Options,
) *BuildMacos {
    const self = owner.allocator.create(@This()) catch @panic("OOM");

    const object = owner.addObject(.{
        .name = options.name,
        .root_source_file = options.root_source_file,
        .target = options.target,
        .optimize = options.optimize,
    });
    object.bundle_compiler_rt = true;

    const swiftc = owner.addSystemCommand(&.{
        "swiftc",
        if (options.optimize == .Debug) "-Onone" else "-O",
        "-import-objc-header",
        "include/ava.h",
        "-lc++",
        "-lsqlite3",
        "-target",
        owner.fmt("{s}-apple-macosx{}", .{ @tagName(options.target.result.cpu.arch), options.target.result.os.version_range.semver.min }),
        "-o",
    });

    const out = swiftc.addOutputFileArg(options.name);

    swiftc.addArg("-Xlinker");
    swiftc.addFileArg(object.getEmittedBin());

    if (options.optimize == .Debug) {
        swiftc.addArgs(&.{ "-D", "DEBUG" });
    }

    swiftc.addFileArg(.{ .path = "src/macos/entry.swift" });
    swiftc.addFileArg(.{ .path = "src/macos/webview.swift" });

    swiftc.step.dependOn(&object.step);

    self.* = .{
        .owner = owner,
        .object = object,
        .root_module = &object.root_module,
        .swiftc = swiftc,
        .out = out,
    };

    return self;
}

pub fn rootModuleTarget(self: *BuildMacos) std.Target {
    return self.object.rootModuleTarget();
}

pub fn getEmittedBin(self: *BuildMacos) std.Build.LazyPath {
    return self.out;
}

pub fn addIncludePath(self: *BuildMacos, path: std.Build.LazyPath) void {
    self.object.addIncludePath(path);
}

pub fn addObject(self: *BuildMacos, object: *std.Build.Step.Compile) void {
    self.swiftc.addArg("-Xlinker");
    self.swiftc.addFileArg(object.getEmittedBin());
}

pub fn linkFramework(self: *BuildMacos, name: []const u8) void {
    self.object.linkFramework(name);
}

// pub fn create(b: *std.Build) !*std.Build.Step {
//     useMacSDK(b, root.llama);
//     useMacSDK(b, root.srv);

//     return &swiftc.step;
// }

// fn useMacSDK(b: *std.Build, step: *std.Build.Step.Compile) void {
//     const macos_sdk = std.mem.trimRight(u8, b.run(&.{ "xcrun", "--show-sdk-path" }), "\n");

//     std.log.debug("Using macOS SDK {s} for step {s}", .{ macos_sdk, step.name });

//     step.addSystemIncludePath(.{ .path = b.fmt("{s}/usr/include", .{macos_sdk}) });
//     step.addFrameworkPath(.{ .path = b.fmt("{s}/System/Library/Frameworks", .{macos_sdk}) });
//     step.addLibraryPath(.{ .path = b.fmt("{s}/usr/lib", .{macos_sdk}) });
// }
