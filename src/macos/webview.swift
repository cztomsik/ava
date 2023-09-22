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

    private let navigationDelegate = NavigationDelegate()
    private let scriptMessageHandler = ScriptMessageHandler()
    private let uiDelegate = WebViewUIDelegate()

    func makeNSView(context: Context) -> WKWebView {
        let cfg = WKWebViewConfiguration()
        cfg.userContentController.add(self.scriptMessageHandler, name: "event")
        
        let webview = WKWebView(frame: .zero, configuration: cfg)
        webview.navigationDelegate = self.navigationDelegate
        webview.uiDelegate = self.uiDelegate

        DispatchQueue.main.async {
            scriptMessageHandler.window = webview.window
        }

        return webview
    }

    func updateNSView(_ uiView: WKWebView, context: Context) {
        navigationDelegate.url = url

        uiView.load(URLRequest(url: URL(string: url)!))
    }
}

final class ScriptMessageHandler: NSObject, WKScriptMessageHandler {
    var window: NSWindow!

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.body as? String {
            case "mousedown":
                if !window.styleMask.contains(.fullScreen) {
                    window.performDrag(with:NSApp.currentEvent!)
                }
            case "dblclick":
                window.performZoom(nil)
            default:
                break
        }
    }
}

final class NavigationDelegate: NSObject, WKNavigationDelegate {
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

final class WebViewUIDelegate: NSObject, WKUIDelegate {
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame: WKFrameInfo,
                 completionHandler: @escaping (String?) -> Void) {
        let textField = NSTextField(frame: NSRect(x: 0, y: 0, width: 300, height: 24))
        textField.stringValue = defaultText ?? ""
        let alert = NSAlert()
        alert.messageText = prompt
        alert.accessoryView = textField
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        alert.beginSheetModal(for: webView.window!) { response in
            if response == .alertFirstButtonReturn {
                completionHandler(textField.stringValue)
            } else {
                completionHandler(nil)
            }
        }
        alert.window.makeFirstResponder(textField)
    }
}