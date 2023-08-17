#include <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AvaWindow : NSWindow
@property (nonatomic, retain) WKWebView* webview;
@end

@interface AvaApplication : NSApplication
@property (nonatomic, assign) char* url;
@property (nonatomic, retain) AvaWindow* window;
- (void) createWindow;
- (void) createMenus;
@end

@implementation AvaApplication
- (void) run {
    [self setActivationPolicy:NSApplicationActivationPolicyRegular];
    [self activateIgnoringOtherApps:YES];

    [self createWindow];
    [self createMenus];

    [super run];
}

- (BOOL) applicationShouldTerminateAfterLastWindowClosed:(NSApplication*)app {
    return YES;
}

- (void) createWindow {
    self.window = [[AvaWindow alloc] autorelease];
    [self.window initWithWebview:NSMakeRect(0, 0, 900, 800) url:self.url];
}

- (void) createMenus {
    id menu = [[NSMenu new] autorelease];
    self.mainMenu = menu;

    id appMenu = [[NSMenu new] autorelease];
    [appMenu addItemWithTitle:@"About Ava" action:nil keyEquivalent:@""];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItemWithTitle:@"Hide Ava" action:@selector(hide:) keyEquivalent:@"h"];
    id hideOthersMenuItem = [appMenu addItemWithTitle:@"Hide Others" action:@selector(hideOtherApplications:) keyEquivalent:@"h"];
    [hideOthersMenuItem setKeyEquivalentModifierMask:(NSEventModifierFlagOption | NSEventModifierFlagCommand)];
    [appMenu addItemWithTitle:@"Show All" action:@selector(unhideAllApplications:) keyEquivalent:@""];
    [appMenu addItem:[NSMenuItem separatorItem]];
    [appMenu addItemWithTitle:@"Quit Ava" action:@selector(terminate:) keyEquivalent:@"q"];
    [menu addItemWithTitle:@"Ava" action:nil keyEquivalent:@""].submenu = appMenu;

    id windowMenu = [[NSMenu new] autorelease];
    [windowMenu addItemWithTitle:@"Minimize" action:@selector(performMiniaturize:) keyEquivalent:@"m"];
    [windowMenu addItemWithTitle:@"Zoom" action:@selector(performZoom:) keyEquivalent:@""];
    [windowMenu addItem:[NSMenuItem separatorItem]];
    [windowMenu addItemWithTitle:@"Bring All to Front" action:@selector(arrangeInFront:) keyEquivalent:@""];
    [menu addItemWithTitle:@"Window" action:nil keyEquivalent:@""].submenu = windowMenu;
    self.windowsMenu = windowMenu;
}
@end

@implementation AvaWindow
- (instancetype) initWithWebview:(NSRect)contentRect url:(char*)url {
    // Create window
    self = [super
        initWithContentRect:contentRect
        styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable
        backing:NSBackingStoreBuffered
        defer:NO];
    self.title = @"Ava";
    self.minSize = NSMakeSize(640, 480);
    [self center];

    // Create webview
    self.webview = [[WKWebView alloc] autorelease];
    [self.webview
        initWithFrame:[self.contentView bounds]
        configuration:[[WKWebViewConfiguration alloc] init]];
    self.contentView = self.webview;
    self.webview.navigationDelegate = self;
    [self.webview loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithUTF8String:url]]]];

    return self;
}

- (void) webView:(WKWebView*)webView didFinishNavigation:(WKNavigation*)navigation {
    [self makeKeyAndOrderFront:nil];
}
@end

void _runWebView(char* url) {
    AvaApplication* app = [AvaApplication sharedApplication];
    app.url = url;
    [app run];
}
