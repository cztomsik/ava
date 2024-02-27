const builtin = @import("builtin");
const std = @import("std");
const tk = @import("tokamak");

pub fn @"GET /system-info"(allocator: std.mem.Allocator, res: *tk.Response) !void {
    const user_home = try std.process.getEnvVarOwned(allocator, if (builtin.target.os.tag == .windows) "USERPROFILE" else "HOME");
    const user_downloads = try std.fs.path.join(allocator, &.{ user_home, "Downloads" });

    return res.sendJson(.{
        .os = builtin.os.tag,
        .os_version = try getOsVersion(allocator),
        .arch = builtin.cpu.arch,
        .cpu_count = std.Thread.getCpuCount() catch 0,
        .total_system_memory = std.process.totalSystemMemory() catch 0,
        .user_home = user_home,
        .user_downloads = user_downloads,
    });
}

fn getOsVersion(allocator: std.mem.Allocator) ![]const u8 {
    if (comptime builtin.os.tag == .macos) {
        var f = try std.fs.openFileAbsolute("/System/Library/CoreServices/.SystemVersionPlatform.plist", .{});
        defer f.close();

        var contents = try f.readToEndAlloc(allocator, 1024);
        defer allocator.free(contents);

        if (std.mem.indexOf(u8, contents, "ProductVersion")) |a| {
            if (std.mem.indexOf(u8, contents[a..], "<string>")) |b| {
                if (std.mem.indexOf(u8, contents[a + b ..], "</string>")) |c| {
                    return allocator.dupe(u8, contents[a + b + 8 .. a + b + c]);
                }
            }
        }
    }

    if (comptime builtin.os.tag == .windows) {
        var info: std.os.windows.RTL_OSVERSIONINFOW = undefined;
        info.dwOSVersionInfoSize = @sizeOf(@TypeOf(info));

        if (std.os.windows.ntdll.RtlGetVersion(&info) == .SUCCESS) {
            return std.fmt.allocPrint(allocator, "{d}.{d}", .{ info.dwMajorVersion, info.dwMinorVersion });
        }
    }

    return "unknown";
}
