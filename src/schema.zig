const std = @import("std");
const util = @import("util.zig");
const sqlite = @import("ava-sqlite");

pub const Model = struct {
    id: ?u32 = null,
    name: []const u8,
    path: []const u8,
    imported: bool = false,
};

pub const Prompt = struct {
    id: ?u32 = null,
    name: []const u8,
    prompt: []const u8,
};

pub const Chat = struct {
    id: ?u32 = null,
    name: []const u8,
    prompt: ?[]const u8 = null,
};

pub const ChatMessage = struct {
    id: ?u32 = null,
    chat_id: ?u32 = null,
    role: []const u8,
    content: []const u8,
};
