// TODO: rename this file

const std = @import("std");
const builtin = @import("builtin");

pub fn getHome() [*:0]const u8 {
    return std.os.getenv("HOME") orelse ".";
}

// TODO: ApplicationSupport, Downloads, etc.
//       (maybe it should just return arr/slice and let the caller to join it with std.fs.path.joinZ?)
