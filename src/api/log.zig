const tk = @import("tokamak");
const util = @import("../util.zig");

pub const @"GET /log" = util.Logger.dump;
