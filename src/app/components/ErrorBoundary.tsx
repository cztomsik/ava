import { useCallback, useErrorBoundary } from "preact/hooks"
import { signal, useComputed } from "@preact/signals"
import { Modal } from "."

const lastError = signal(null)

addEventListener("unhandledrejection", rej => (lastError.value = rej.reason))

export const ErrorBoundary = ({ children }) => {
  useErrorBoundary(err => (lastError.value = err))

  const message = useComputed(() => lastError.value?.message ?? lastError.value)
  const reset = useCallback(() => (lastError.value = null), [])

  return (
    <div>
      {children}

      {message.value && (
        <Modal title="Unexpected Error" onClose={reset}>
          <pre class="">{message}</pre>
        </Modal>
      )}
    </div>
  )
}
