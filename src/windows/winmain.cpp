#include <functional>
#include <windows.h>
#include <tchar.h>
#include <WebView2.h>
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
    if (!RegisterClassEx(&wc)) return ShowError(_T("Failed to register window class"));

    // Create window
    hWnd = CreateWindowEx(0, CLASS_NAME, TITLE, WS_OVERLAPPEDWINDOW, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, CW_USEDEFAULT, NULL, NULL, hInstance, NULL);
    if (!hWnd) return ShowError(_T("Failed to create window"));
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
                env->CreateCoreWebView2Controller(hWnd, 
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, HRESULT, ICoreWebView2Controller*>(
                        [&](HRESULT result, ICoreWebView2Controller* ctrl) -> HRESULT {
                            if (ctrl != NULL) {
                                controller = ctrl;
                                controller->get_CoreWebView2(&webview);
                            }

                            if (webview != NULL) {
                                controller->AddRef();
                                webview->Navigate(L"https://www.google.com");
                                webview->AddRef();
                                resize();
                            }

                            wait.clear();
                            return S_OK;
                        }).Get());

                // Pump for a while
                while (wait.test_and_set() && tick()) {}

                return S_OK;
            }).Get());
    
    return 0;
}

// Application entry point
int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    if (createWindow(hInstance, nCmdShow) || createWebView()) return 1;

    while (tick()) {}

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
