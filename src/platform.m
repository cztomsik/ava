#include <Cocoa/Cocoa.h>
#import <WebKit/WebKit.h>

@interface AppDelegate: NSObject <NSApplicationDelegate>
@property (strong, nonatomic) NSString *url;
@property (nonatomic) BOOL debug;
@property (strong, nonatomic) NSWindow *window;
@property (strong, nonatomic) WKWebView *webview;
@end

@implementation AppDelegate

- (void)applicationWillFinishLaunching:(NSNotification *)notification {
    [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
    [NSApp activateIgnoringOtherApps:YES];
    [self createWebview];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)app {
    return YES;
}

- (void)createWebview {
    NSWindow *win = self.window;

    WKWebViewConfiguration *cfg = [[WKWebViewConfiguration alloc] init];
    cfg.preferences = [[WKPreferences alloc] init];
    if (self.debug) [cfg.preferences setValue:@YES forKey:@"developerExtrasEnabled"];
    cfg.userContentController = [[WKUserContentController alloc] init];
    [cfg.userContentController addScriptMessageHandler:(id)self name:@"event"];

    WKWebView *webview = [[WKWebView alloc] initWithFrame:[win.contentView bounds] configuration:cfg];
    webview.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    webview.navigationDelegate = (id)self;
    self.webview = webview;

    [win.contentView addSubview:webview];
    [webview loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:self.url]]];
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
    [self.window makeKeyAndOrderFront:nil];
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error {
    NSLog(@"Error: %@", error);
}

- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)navigationAction decisionHandler:(void (^)(WKNavigationActionPolicy))decision {
    NSURL *url = navigationAction.request.URL;
    if ([url.scheme isEqualToString:@"file"]) {
        decision(WKNavigationActionPolicyCancel);
    } else {
        if ([url.absoluteString hasPrefix:self.url]) {
            decision(WKNavigationActionPolicyAllow);
        } else {
            [[NSWorkspace sharedWorkspace] openURL:url];
            decision(WKNavigationActionPolicyCancel);
        }
    }
}

- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
    if ([message.body isEqualToString:@"mousedown"]) {
        if (self.window.styleMask & NSWindowStyleMaskFullScreen) return;

        NSEvent *event = [NSApp currentEvent];
        [self.window performWindowDragWithEvent:event];
    }

    if ([message.body isEqualToString:@"dblclick"]) {
        [self.window performZoom:nil];
    }
}

@end

// adapted from https://developer.apple.com/documentation/appkit/nsapplication#overview
void _runWebViewApp(const char *url, BOOL debug) {
    [NSApplication sharedApplication];
    [[NSBundle mainBundle] loadNibNamed:@"MainMenu" owner:NSApp topLevelObjects:nil];

    AppDelegate *appDelegate = [NSApp delegate];
    appDelegate.url = [NSString stringWithUTF8String:url];
    appDelegate.debug = debug;

    [NSApp run];
}
