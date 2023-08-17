#include <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

void _runWebView(char* url) {
    id app = [NSApplication sharedApplication];
    [app setActivationPolicy:NSApplicationActivationPolicyRegular];
    [app activateIgnoringOtherApps:YES];

    id menubar = [[NSMenu alloc] autorelease];
    [app setMainMenu:menubar];

    id window = [[NSWindow alloc] autorelease];
    [window
        initWithContentRect:NSMakeRect(0, 0, 800, 600)
        styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable
        backing:NSBackingStoreBuffered
        defer:NO];
    [window setTitle:@"Ava"];
    [window center];
    [window makeKeyAndOrderFront:nil];

    id webview = [[WKWebView alloc] autorelease];
    [webview
        initWithFrame:[[window contentView] frame]
        configuration:[[WKWebViewConfiguration alloc] init]];
    [webview loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithUTF8String:url]]]];
    [window setContentView:webview];
    [window setMinSize:NSMakeSize(640, 480)];

    [app run];
}
