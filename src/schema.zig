const std = @import("std");
const llama = @import("llama.zig");

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
    sampling: llama.SamplingParams = .{},
};

pub const ChatWithLastMessage = struct {
    id: ?u32 = null,
    name: []const u8,
    last_message: ?[]const u8,
};

pub const ChatMessage = struct {
    id: ?u32 = null,
    chat_id: ?u32 = null,
    role: []const u8,
    content: []const u8,
};

pub const QuickTool = struct {
    id: ?u32 = null,
    name: []const u8,
    description: []const u8,
    prompt: []const u8,
};
