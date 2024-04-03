const std = @import("std");
const fr = @import("fridge");
const ava = @import("../app.zig");

pub fn @"GET /config"(app: *ava.App) !ava.Config {
    return app.config.value;
}

pub fn @"PUT /config"(app: *ava.App, config: ava.Config) !ava.Config {
    try app.updateConfig(config);
    return app.config.value;
}
