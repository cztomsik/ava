import { useCallback, useEffect, useErrorBoundary } from "preact/hooks"
import { useSignal } from "@preact/signals"
import { Modal } from "."

/**
 * A component that catches errors in the component tree and unhandled promise
 * rejections and displays them in a modal.
 */
export const ErrorBoundary = ({ children }) => {
  const lastError = useSignal(null)

  // Errors in the component tree (render, event handlers, etc.)
  useErrorBoundary(err => (lastError.value = err))

  // Unhandled promise rejections (fetch, async, etc.)
  useEffect(() => {
    const listener = rej => (lastError.value = rej.reason)
    addEventListener("unhandledrejection", listener)

    return () => removeEventListener("unhandledrejection", listener)
  })

  // Clear the error when the user closes the modal
  const reset = useCallback(() => (lastError.value = null), [])

  return (
    <div>
      {children}

      {lastError.value && (
        <Modal title="Unexpected Error" onClose={reset}>
          <pre class="">{lastError.value.message ?? lastError.value}</pre>
        </Modal>
      )}
    </div>
  )
}