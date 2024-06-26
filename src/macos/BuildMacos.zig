const std = @import("std");
const root = @import("../../build.zig");
const BuildMacos = @This();

pub const Options = struct {
    name: []const u8,
    root_source_file: std.Build.LazyPath,
    target: std.Build.ResolvedTarget,
    optimize: std.builtin.OptimizeMode,
    strip: bool,
};

owner: *std.Build,
object: *std.Build.Step.Compile,
root_module: *std.Build.Module,
swiftc: *std.Build.Step.Run,
out: std.Build.LazyPath,
sdk: []const u8,

pub fn create(owner: *std.Build, options: Options) *BuildMacos {
    const self = owner.allocator.create(@This()) catch @panic("OOM");

    const object = owner.addObject(.{
        .name = options.name,
        .root_source_file = options.root_source_file,
        .target = options.target,
        .optimize = options.optimize,
        .strip = options.strip,
    });
    object.bundle_compiler_rt = true;

    const compile_target = owner.fmt("{s}-apple-macosx{}", .{
        if (options.target.result.cpu.arch == .aarch64) "arm64" else @tagName(options.target.result.cpu.arch),
        options.target.result.os.version_range.semver.min,
    });

    const swiftc = owner.addSystemCommand(&.{
        "swiftc",
        if (options.optimize == .Debug) "-Onone" else "-O",
        "-import-objc-header",
        "include/ava.h",
        "-lc++",
        "-lsqlite3",
        "-target",
        compile_target,
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
        .sdk = std.zig.system.darwin.getSdk(owner.allocator, options.target.result) orelse @panic("No suitable SDK found"),
    };

    self.applySDK(object);

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

pub fn applySDK(self: *BuildMacos, step: anytype) void {
    std.log.debug("Using macOS SDK {s} for step {s}", .{ self.sdk, step.name });

    step.addSystemIncludePath(.{ .path = self.owner.fmt("{s}/usr/include", .{self.sdk}) });
    step.addFrameworkPath(.{ .path = self.owner.fmt("{s}/System/Library/Frameworks", .{self.sdk}) });
    step.addLibraryPath(.{ .path = self.owner.fmt("{s}/usr/lib", .{self.sdk}) });
}
