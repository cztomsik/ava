import SwiftUI

@main
struct Main: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject var state = AppState.shared

    var body: some Scene {
        WindowGroup {
            WebViewContent(url: "http://127.0.0.1:\(state.port)/")
                .frame(
                    minWidth: 700, idealWidth: 900, 
                    minHeight: 480, idealHeight: 800)
                .edgesIgnoringSafeArea(.top) 
        }
        .windowStyle(.hiddenTitleBar)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationWillFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)

        if (ava_start() != 0 || ava_get_port() < 0) {
            exit(1)
        }

        signal(SIGPIPE) { _ in
            // Ignore SIGPIPE which is sent when the client closes the connection (which is normal)
        }

        AppState.shared.port = ava_get_port()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    func applicationWillTerminate(_ notification: Notification) {
        ava_stop()
    }
}

final class AppState: ObservableObject {
    static let shared = AppState()

    @Published var port: Int32 = -1
}
