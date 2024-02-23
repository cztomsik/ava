import { useEffect, useErrorBoundary } from "preact/hooks"
import { Modal } from "./Modal"

const handleError = error => Modal.open(ErrorModal, { error })

export const ErrorBoundary = ({ children, ...props }) => {
  // Errors in the component tree (render, event handlers, etc.)
  useErrorBoundary(err => void handleError(err))

  // Unhandled promise rejections (fetch, async, etc.)
  useEffect(() => {
    const listener = rej => handleError(rej.reason)
    addEventListener("unhandledrejection", listener)

    return () => removeEventListener("unhandledrejection", listener)
  }, [])

  return <div {...props}>{children}</div>
}

const ErrorModal = ({ error, resolve }) => (
  <Modal title="Unexpected Error" onClose={resolve}>
    <p class="mb-4">An unexpected error occurred. ({error.constructor.name})</p>
    <pre class="p-0 whitespace-pre-wrap overflow-auto">
      {[error.message ?? error, error.response, error.stack].filter(Boolean).join("\n\n")}
    </pre>
  </Modal>
)
