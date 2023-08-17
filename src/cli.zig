const std = @import("std");
const builtin = @import("builtin");
const db = @import("db.zig");
const allocator = std.heap.c_allocator;

const Options = struct {
    help: bool = false,
    headless: bool = false,
};

pub fn parseArgs() !Options {
    var args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    var options = Options{};

    for (args) |arg| {
        inline for (std.meta.fields(Options)) |f| {
            if (comptime f.type == bool) {
                if (std.mem.eql(u8, arg, "--" ++ f.name)) {
                    @field(options, f.name) = true;
                }
            }
        }
    }

    return options;
}

pub fn printHelp() !void {
    const help =
        \\
        \\ Usage: ava [options]
        \\
        \\ Options:
        \\   --help          Print this help message and exit
        \\   --headless      Run in headless mode
        \\
    ;

    try std.io.getStdOut().writeAll(help);
}

pub fn printBanner(address: std.net.Address) !void {
    const target = try builtin.target.linuxTriple(allocator);
    defer allocator.free(target);

    const banner =
        \\
        \\  /\ \  / /\             Server running
        \\ /--\ \/ /--\  v{s}    http://{}
        \\ _____________________________________________
        \\
        \\ target: {s}
        \\ sqlite: {s}
        \\
        \\
    ;

    var writer = std.io.getStdOut().writer();
    try writer.print(
        banner,
        .{
            "0.0.1",
            address,
            target,
            try db.version(),
        },
    );
}
