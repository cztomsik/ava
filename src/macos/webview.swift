import SwiftUI
import WebKit

struct WebViewContent: View {
    var url: String?

    var body: some View {
        (url != nil)
            ?AnyView(WebView(url: url!))
            :AnyView(ProgressView())
    }
}

struct WebView: NSViewRepresentable {
    var url: String

    private let delegate = WebViewDelegate()
    private let scriptMessageHandler = ScriptMessageHandler()

    func makeNSView(context: Context) -> WKWebView {
        let cfg = WKWebViewConfiguration()
        cfg.userContentController.add(scriptMessageHandler, name: "event")

        #if DEBUG
            cfg.preferences.setValue(true, forKey: "developerExtrasEnabled")
        #endif
        
        let webview = WKWebView(frame: .zero, configuration: cfg)
        webview.navigationDelegate = delegate
        webview.uiDelegate = delegate

        return webview
    }

    func updateNSView(_ uiView: WKWebView, context: Context) {
        delegate.url = url

        uiView.load(URLRequest(url: URL(string: url)!))
    }
}

final class ScriptMessageHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.body as? String {
            case "mousedown":
                if let e = NSApp.currentEvent {
                    if !e.window!.styleMask.contains(.fullScreen) {
                        e.window!.performDrag(with:e)
                    }
                }
            case "dblclick":
                if let e = NSApp.currentEvent {
                    e.window!.performZoom(nil)
                }
            default:
                break
        }
    }
}

final class WebViewDelegate: NSObject, WKNavigationDelegate, WKUIDelegate {
    var url: String = ""
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // TODO: Show initial loading indicator until this method is called
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Error: \(error)")
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy)->Void) {
        if let url = navigationAction.request.url?.absoluteString {
            if url.starts(with: "file://") {
                decisionHandler(.cancel)
            } else if url.starts(with: self.url) {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
                NSWorkspace.shared.open(URL(string: url)!)
            }
        }
    }
}
