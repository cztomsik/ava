const std = @import("std");
const tk = @import("tokamak");

// TODO: Find a better way (Zig 0.15.1)
pub const root: tk.Route = .{
    .children = &.{
        .router(chat),
        .router(completions),
        // .router(download),
        .router(find_models),
        .router(log),
        .router(models),
        .router(prompts),
        .router(proxy),
        .router(quick_tools),
        .router(config),
        .router(system_info),
    },
};

pub const chat = @import("api/chat.zig");
pub const completions = @import("api/completions.zig");
pub const download = @import("api/download.zig");
pub const find_models = @import("api/find-models.zig");
pub const log = @import("api/log.zig");
pub const models = @import("api/models.zig");
pub const prompts = @import("api/prompts.zig");
pub const proxy = @import("api/proxy.zig");
pub const quick_tools = @import("api/quick-tools.zig");
pub const config = @import("api/config.zig");
pub const system_info = @import("api/system-info.zig");
