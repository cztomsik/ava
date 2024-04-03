const std = @import("std");
const fr = @import("fridge");
const ava = @import("../app.zig");

pub fn @"GET /config"(app: *ava.App, allocator: std.mem.Allocator) !ava.Config {
    return (try app.readConfig(allocator)).value;
}

pub fn @"PUT /config"(app: *ava.App, config: ava.Config) !ava.Config {
    try app.writeConfig(config);
    return config;
}
