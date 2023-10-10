// Do one tick of the message loop
int tick() {
    MSG msg;
    if (GetMessage(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
        return 1;
    } else {
        return 0;
    }
}

// Show a message box with an error message
int ShowError(LPCTSTR msg) {
    MessageBox(NULL, msg, _T("Error"), NULL);
    return 1;
}

// COM wrapper for a callback
template <typename T, typename A, typename B>
class Callback : public T {
public:
    Callback(std::function<HRESULT(A, B)> fun): m_fun(fun) {}

    STDMETHODIMP QueryInterface(REFIID riid, void** ppv) {
        // TODO: check riid
        *ppv = static_cast<T*>(this);
        AddRef();
        return S_OK;
    }

    STDMETHODIMP_(ULONG) AddRef() {
        return InterlockedIncrement(&m_refCount);
    }

    STDMETHODIMP_(ULONG) Release() {
        ULONG refCount = InterlockedDecrement(&m_refCount);
        if (refCount == 0) delete this;
        return refCount;
    }

    STDMETHODIMP_(HRESULT) Invoke(A a, B b) {
        return m_fun(a, b);
    }

    T* Get() {
        return static_cast<T*>(this);
    }

private:
    ULONG m_refCount = 1;
    std::function<HRESULT(A, B)> m_fun;
};

