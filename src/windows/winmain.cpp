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
                if (result != S_OK) {
                    printf("Failed to create WebView2 environment %d\n", result);
                    return result;
                }

                env->CreateCoreWebView2Controller(hWnd, 
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler, HRESULT, ICoreWebView2Controller*>(
                        [&](HRESULT result, ICoreWebView2Controller* ctrl) -> HRESULT {
                            if (result != S_OK) {
                                printf("Failed to create WebView2 controller %d\n", result);
                                return result;
                            }

                            if (ctrl != NULL) {
                                controller = ctrl;
                                controller->get_CoreWebView2(&webview);
                            }

                            if (webview != NULL) {
                                controller->AddRef();
                                webview->AddRef();
                                resize();

                                ICoreWebView2Settings *settings = nullptr;
                                webview->get_Settings(&settings);
                                settings->put_AreDevToolsEnabled(FALSE);
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
    if (ava_start()) return ShowError(_T("Failed to start server"));

    if (createWindow(hInstance, nCmdShow)) return ShowError(_T("Failed to create window"));
    if (createWebView()) return ShowError(_T("Failed to create webview"));

    // Load the webui which is running at http://127.0.0.1:<ava_port()>
    std::wstring url = L"http://127.0.0.1:";
    url += std::to_wstring(ava_get_port());
    webview->Navigate(url.c_str());

    while (tick()) {}

    printf("Stopping server\n");
    ava_stop();

    printf("Releasing COM objects\n");
    webview->Release();
    controller->Release();
    return 0;
}

// Window handler
LRESULT CALLBACK WindowProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
        case WM_QUIT:
            return 0;
        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
        case WM_SIZE:
            resize();
        default:
            return DefWindowProc(hWnd, message, wParam, lParam);
    }
}
