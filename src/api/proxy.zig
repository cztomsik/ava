// TODO: later

// const std = @import("std");
// const tk = @import("tokamak");

// pub fn @"POST /proxy"(allocator: std.mem.Allocator, res: *tk.Response, params: struct { url: []const u8 }) !void {
//     inline for (.{ "Accept-Encoding", "Content-Type", "Content-Length", "Host", "Referer", "Origin" }) |h| {
//         _ = res.request.headers.delete(h);
//     }
//     try res.request.headers.append("Accept-Encoding", "gzip, deflate");

//     var client: std.http.Client = .{ .allocator = allocator };
//     defer client.deinit();

//     var req = try client.open(.GET, try std.Uri.parse(params.url), res.request.headers, .{});
//     defer req.deinit();

//     try req.send(.{});
//     try req.wait();

//     res.status = req.response.status;
//     res.headers = try req.response.headers.clone(allocator);
//     res.transfer_encoding = .chunked;
//     _ = res.headers.delete("Transfer-Encoding");
//     _ = res.headers.delete("Content-Encoding");
//     _ = res.headers.delete("Content-Length");
//     _ = res.headers.delete("Link"); // Otherwise browser will try to preload non-existent resources
//     try res.send();

//     var buf: [512]u8 = undefined;
//     var written: usize = 0;

//     while (true) {
//         if (written == req.response.content_length) break;
//         const n = try req.read(buf[0..]);
//         if (n == 0) break;
//         try res.writeAll(buf[0..n]);
//         written += n;
//     }
// }
