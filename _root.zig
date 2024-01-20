// Zig has recently disallowed usage of @embedFile outside of the package path,
// which is where the root source file is located. We need to @embedFile
// both README.md and zig-out/app/main.js so this is a workaround for that.
pub usingnamespace @import("src/main.zig");
