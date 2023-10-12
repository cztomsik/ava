#include <functional>
#include <string>
#include <windows.h>
#include <tchar.h>
#include <WebView2.h>
#include <ava.h>
#include "util.h"

// Globals
HWND hWnd = NULL;
ICoreWebView2Environment* environment = NULL;
ICoreWebView2* webview = NULL;
ICoreWebView2Controller* controller = NULL;
LRESULT CALLBACK WindowProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam);

int createWindow(HINSTANCE hInstance, int nCmdShow) {
    static TCHAR CLASS_NAME[] = _T("AvaPLS");
    static TCHAR TITLE[] = _T("Ava PLS");

    // Register window class
    WNDCLASSEX wc = {};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.lpfnWndProc = WindowProc;
    RegisterClassEx(&wc);

    // Create window
    hWnd = CreateWindowEx(0, CLASS_NAME, TITLE, WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, NULL, NULL, hInstance, NULL);
    if (!hWnd) return 1;
    ShowWindow(hWnd, nCmdShow);
    UpdateWindow(hWnd);
    SetFocus(hWnd);

    return 0;
}

void resize() {
    if (controller == NULL) return;
    RECT bounds;
    GetClientRect(hWnd, &bounds);
    controller->put_Bounds(bounds);
}

int createWebView() {
    std::atomic_flag wait = ATOMIC_FLAG_INIT;
    wait.test_and_set();

    // Create WebView2 environment
    CreateCoreWebView2Environment(
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler, HRESULT, ICoreWebView2Environment*>(
            [&](HRESULT result, ICoreWebView2Environment* env) -> HRESULT {
                printf("WebView2 environment completed %d\n", result);

                env->CreateCoreWebView2Controller(hWnd, 
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, HRESULT, ICoreWebView2Controller*>(
                        [&](HRESULT result, ICoreWebView2Controller* ctrl) -> HRESULT {
                            printf("WebView2 controller completed %d\n", result);

                            if (ctrl != NULL) {
                                printf("WebView2 controller created\n");
                                controller = ctrl;
                                controller->get_CoreWebView2(&webview);
                            }

                            if (webview != NULL) {
                                printf("WebView2 created\n");
                                controller->AddRef();
                                webview->AddRef();

                                printf("WebView2 resizing\n");
                                resize();

                                // Load the webui which is running at http://127.0.0.1:<ava_port()>
                                printf("Constructing URL\n");
                                std::wstring url = L"http://127.0.0.1:";
                                url += std::to_wstring(ava_get_port());
                                printf("Navigating to %ls\n", url.c_str());
                                webview->Navigate(url.c_str());

                                printf("Disabling dev tools\n");
                                ICoreWebView2Settings *settings = nullptr;
                                webview->get_Settings(&settings);
                                settings->put_AreDevToolsEnabled(FALSE);
                            }

                            printf("WebView2 environment ready\n");
                            wait.clear();
                            return S_OK;
                        }).Get());

                // Pump for a while
                printf("WebView2 environment waiting\n");
                while (wait.test_and_set() && tick()) {}

                return S_OK;
            }).Get());
    
    return 0;
}

// Application entry point
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    if (ava_start()) return ShowError(_T("Failed to start server"));
    if (createWindow(hInstance, nCmdShow)) return ShowError(_T("Failed to create window"));
    if (createWebView()) return ShowError(_T("Failed to create webview"));

    while (tick()) {}

    ava_stop();
    webview->Release();
    controller->Release();
    return 0;
}

// Window handler
LRESULT CALLBACK WindowProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
        case WM_DESTROY:
            PostQuitMessage(0);
            break;
        case WM_SIZE:
            resize();
        default:
            return DefWindowProc(hWnd, message, wParam, lParam);
    }
}
