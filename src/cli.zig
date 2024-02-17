const std = @import("std");
const ava = @import("main.zig");

// This is only used for the headless build
pub fn main() !void {
    std.log.debug("Starting the server", .{});
    try ava.start();

    const banner =
        \\
        \\  /\ \  / /\             Server running
        \\ /--\ \/ /--\            http://{}
        \\ _____________________________________________
        \\
        \\
    ;

    std.debug.print(banner, .{
        ava.app.?.server.http.socket.listen_address,
    });

    ava.app.?.server.thread.join();

    std.log.debug("Stopping the server", .{});
    _ = ava.ava_stop();
}
