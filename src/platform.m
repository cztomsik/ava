#include <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AvaWindow : NSWindow
@property (strong, nonatomic) WKWebView *webview;
@end

@interface AvaApplication : NSApplication
@property (strong, nonatomic) NSString *url;
@property (nonatomic) BOOL debug;
@property (strong, nonatomic) AvaWindow *window;
- (void)createWindow;
- (void)createMenus;
@end

@implementation AvaApplication

- (void)applicationWillFinishLaunching:(NSNotification *)notification {
    [self setActivationPolicy:NSApplicationActivationPolicyRegular];
    [self activateIgnoringOtherApps:YES];
    [self createWindow];
    [self createMenus];
}

- (NSApplicationTerminateReply)applicationShouldTerminate:(NSApplication *)sender {
    return NSTerminateNow;
}

- (BOOL)applicationShouldHandleReopen:(NSApplication *)sender hasVisibleWindows:(BOOL)flag {
    return NO;
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)app {
    return YES;
}

- (void)createWindow {
    NSWindowStyleMask mask = NSWindowStyleMaskTitled | NSWindowStyleMaskFullSizeContentView | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable;
    AvaWindow *win = [[AvaWindow alloc] initWithContentRect:NSMakeRect(0, 0, 900, 800)
                                                  styleMask:mask
                                                    backing:NSBackingStoreBuffered
                                                      defer:NO];

    if (!win) {
        NSLog(@"Failed to create window");
        exit(1);
    }

    win.title = @"Ava";
    win.titleVisibility = NSWindowTitleHidden;
    win.titlebarAppearsTransparent = YES;
    win.minSize = NSMakeSize(700, 480);
    win.frameAutosaveName = @"Ava.main";

    WKWebViewConfiguration *cfg = [[WKWebViewConfiguration alloc] init];
    cfg.preferences = [[WKPreferences alloc] init];
    if (self.debug) [cfg.preferences setValue:@YES forKey:@"developerExtrasEnabled"];
    cfg.userContentController = [[WKUserContentController alloc] init];
    [cfg.userContentController addScriptMessageHandler:(id)win name:@"event"];

    win.webview = [[WKWebView alloc] initWithFrame:[win.contentView bounds] configuration:cfg];
    win.webview.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    win.webview.navigationDelegate = (id)win;

    [win.contentView addSubview:win.webview];
    [win.webview loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:self.url]]];

    self.window = win;
}

- (void)createMenus {
    NSString *name = @"Ava";
    id menu = [[NSMenu new] autorelease];
    self.mainMenu = menu;

    id appMenu = [[NSMenu new] autorelease];
    [appMenu addItemWithTitle:[NSString stringWithFormat:@"About %@", name] action:nil keyEquivalent:@""];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItemWithTitle:[NSString stringWithFormat:@"Hide %@", name] action:@selector(hide:) keyEquivalent:@"h"];
    id hideOthersMenuItem = [appMenu addItemWithTitle:@"Hide Others" action:@selector(hideOtherApplications:) keyEquivalent:@"h"];
    [hideOthersMenuItem setKeyEquivalentModifierMask:(NSEventModifierFlagOption | NSEventModifierFlagCommand)];
    [appMenu addItemWithTitle:@"Show All" action:@selector(unhideAllApplications:) keyEquivalent:@""];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItemWithTitle:[NSString stringWithFormat:@"Quit %@", name] action:@selector(terminate:) keyEquivalent:@"q"];
    [menu addItemWithTitle:name action:nil keyEquivalent:@""].submenu = appMenu;

    id windowMenu = [[[NSMenu alloc] autorelease] initWithTitle:@"Window"];
    [windowMenu addItemWithTitle:@"Minimize" action:@selector(performMiniaturize:) keyEquivalent:@"m"];
    [windowMenu addItemWithTitle:@"Zoom" action:@selector(performZoom:) keyEquivalent:@""];
    [windowMenu addItem:[NSMenuItem separatorItem]];
    [windowMenu addItemWithTitle:@"Bring All to Front" action:@selector(arrangeInFront:) keyEquivalent:@""];
    [menu addItemWithTitle:@"" action:nil keyEquivalent:@""].submenu = windowMenu;    
    self.windowsMenu = windowMenu;
}

@end

@implementation AvaWindow

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    [self makeKeyAndOrderFront:nil];
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"Error: %@", error);
}

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.body isEqualToString:@"mousedown"]) {
        if (self.styleMask & NSWindowStyleMaskFullScreen) return;

        NSEvent *event = [NSApp currentEvent];
        [self performWindowDragWithEvent:event];
    }

    if ([message.body isEqualToString:@"dblclick"]) {
        [self performZoom:nil];
    }
}

@end

// adapted from https://developer.apple.com/documentation/appkit/nsapplication#overview
void _runWebView(const char *url, BOOL debug) {
    @autoreleasepool {
        AvaApplication *app = [AvaApplication sharedApplication];
        app.delegate = (id)app;
        app.url = [NSString stringWithUTF8String:url];
        app.debug = debug;
        [app run];
    }
}
