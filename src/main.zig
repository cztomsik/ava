const std = @import("std");
const builtin = @import("builtin");
const Server = @import("server.zig").Server;
const db = @import("db.zig");
const llama = @import("llama.zig");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub fn main() !void {
    defer _ = gpa.deinit();

    llama.init(allocator);
    try db.init();

    var server = try Server.start(allocator, "127.0.0.1", 3000);
    defer server.deinit();

    try printBanner(server.http.socket.listen_address);
    server.thread.join();
}

fn printBanner(address: std.net.Address) !void {
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
