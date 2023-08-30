#include <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AvaWindow : NSWindow
@property (strong, nonatomic) WKWebView *webview;
@end

@interface AvaApplication : NSApplication
@property (strong, nonatomic) NSString *url;
@property (strong, nonatomic) AvaWindow *window;
- (void)createWindow;
- (void)createMenus;
@end

@implementation AvaApplication

- (void)run {
    self.delegate = self;
    
    [super run];
}

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
    self.window = [[AvaWindow alloc] initWithUrl:NSMakeRect(0, 0, 900, 800) url:self.url];
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

- (instancetype)initWithUrl:(NSRect)contentRect url:(NSString *)url {
    self = [super initWithContentRect:contentRect
                            styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskFullSizeContentView | NSWindowStyleMaskClosable | NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable
                              backing:NSBackingStoreBuffered
                                defer:NO];
    if (self) {
        self.title = @"Ava";
        self.titleVisibility = NSWindowTitleHidden;
        self.titlebarAppearsTransparent = YES;
        self.minSize = NSMakeSize(770, 480);
        self.frameAutosaveName = @"Ava.main";

        self.webview = [[WKWebView alloc] initWithFrame:[self.contentView bounds]
                                          configuration:[[WKWebViewConfiguration alloc] init]];
        self.webview.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
        self.webview.navigationDelegate = self;

        [self.contentView addSubview:self.webview];
        [self.webview loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:url]]];
    }
    
    return self;
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    [self makeKeyAndOrderFront:nil];
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"Error: %@", error);
}

- (void)sendEvent:(NSEvent *)event {
    // Pass through anything outside the titlebar/sidebar area
    // TODO: This is a hack, we need to find a better way to find what is
    //       supposed to trigger a window drag and what is not.
    if (
        self.mouseLocationOutsideOfEventStream.y - self.contentLayoutRect.size.height < -30 &&
        self.mouseLocationOutsideOfEventStream.x > 200
    ) {
        [super sendEvent:event];
        return;
    } 

    if (event.type == NSEventTypeLeftMouseDown && NSCursor.currentCursor != NSCursor.pointingHandCursor) {
        [self performWindowDragWithEvent:event];
        return;
    }

    [super sendEvent:event];
}

@end

void _runWebView(const char *url) {
    @autoreleasepool {
        AvaApplication *app = [AvaApplication sharedApplication];
        app.url = [NSString stringWithUTF8String:url];
        [app run];
    }
}