const std = @import("std");
// const cli = @import("cli.zig");
const db = @import("db.zig");
const llama = @import("llama.zig");
const platform = @import("platform.zig");
const Server = @import("server.zig").Server;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

var server: ?*Server = null;

// pub fn main() !void {
//     defer _ = gpa.deinit();

//     const options = try cli.parseArgs();
//     if (options.help) return try cli.printHelp();

//     llama.init(allocator);
//     defer llama.deinit();

//     try db.init(allocator);
//     defer db.deinit();

//     var server = try Server.start(allocator, "127.0.0.1", 3002);
//     defer server.deinit();

//     if (options.headless) {
//         try cli.printBanner(server.http.socket.listen_address);
//         server.thread.join();
//     } else {
//         const url = try std.fmt.allocPrintZ(allocator, "http://127.0.0.1:{}", .{server.http.socket.listen_address.getPort()});
//         defer allocator.free(url);

//         platform.runWebViewApp(url);
//     }
// }

pub export fn ava_start() c_int {
    llama.init(allocator);

    db.init(allocator) catch |err| {
        std.log.err("DB error: {}", .{err});
        return 1;
    };

    server = Server.start(allocator, "127.0.0.1", 3002) catch |err| {
        std.log.err("Server error: {}", .{err});
        return 1;
    };

    server.?.thread.detach();

    return 0;
}

pub export fn ava_get_port() c_int {
    return if (server == null) -1 else server.?.http.socket.listen_address.getPort();
}

pub export fn ava_stop() c_int {
    if (server == null) return 1;

    server.?.deinit();
    db.deinit();
    llama.deinit();
    return 0;
}
