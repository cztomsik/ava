// Zig has recently disallowed usage of @embedFile outside of the package path,
// which is where the root source file is located. We need to @embedFile
// both README.md and zig-out/app/main.js so this is a workaround for that.
//
// On top of that, we can easily switch between headless and GUI mode just by
// changing the root source file.
pub usingnamespace @import("src/main.zig");
pub usingnamespace @import("src/cli.zig");
