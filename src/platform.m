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
    webview.UIDelegate = (id)self;
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

// TODO: either provide/fix the icon or replace it with a custom modal implementation (which may be in JS or even in nib)
- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt defaultText:(nullable NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame completionHandler:(nonnull void (^)(NSString * _Nullable))completionHandler {
    NSAlert *alert = [[NSAlert alloc] init];
    alert.messageText = prompt;
    NSTextField *input = [[NSTextField alloc] initWithFrame:NSMakeRect(0, 0, 300, 24)];
    input.stringValue = defaultText;
    alert.accessoryView = input;
    [alert addButtonWithTitle:@"OK"];
    [alert addButtonWithTitle:@"Cancel"];
    [alert beginSheetModalForWindow:self.window completionHandler:^(NSModalResponse returnCode) {
        if (returnCode == NSAlertFirstButtonReturn) {
            completionHandler(input.stringValue);
        } else {
            completionHandler(nil);
        }
    }];
    [alert.window makeFirstResponder:input];
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

    if ([message.body hasPrefix:@"download "]) {
        NSString *url = [message.body substringFromIndex:9];
        [self.webview startDownloadUsingRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:url]] completionHandler:^(WKDownload *download) {
            download.delegate = (id)self;
        }];
    }
}

- (void)download:(WKDownload *)download decideDestinationUsingResponse:(NSURLResponse *)response suggestedFilename:(NSString *)suggestedFilename completionHandler:(void (^)(NSURL * _Nullable destination))completionHandler {
    NSURL *modelsURL = [[NSFileManager defaultManager] URLForDirectory:NSDownloadsDirectory inDomain:NSUserDomainMask appropriateForURL:nil create:YES error:nil];
    NSURL *fileURL = [modelsURL URLByAppendingPathComponent:suggestedFilename];

    if ([[NSFileManager defaultManager] fileExistsAtPath:fileURL.path]) {
        NSLog(@"Removing existing file at %@", fileURL);
        [[NSFileManager defaultManager] removeItemAtURL:fileURL error:nil];
    }

    completionHandler(fileURL);
    [self reportProgress:download];
}

- (void)reportProgress:(WKDownload *)download {
    [self.webview evaluateJavaScript:[NSString stringWithFormat:@"reportProgress(Math.floor(%f * 100))", download.progress.fractionCompleted] completionHandler:nil];

    if (!(download.progress.isCancelled || download.progress.isFinished)) {
        [self performSelector:@selector(reportProgress:) withObject:download afterDelay:1];
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
