const std = @import("std");
const fr = @import("fridge");
const ava = @import("../app.zig");

pub fn @"GET /config"(config: ava.Config) !ava.Config {
    return config;
}

pub fn @"PUT /config"(app: *ava.App, config: ava.Config) !ava.Config {
    try app.updateConfig(config);
    return app.config.value;
}
