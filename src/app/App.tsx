import { ErrorBoundary, ModalBackdrop } from "./_components"
import { Sidebar } from "./Sidebar"
import { router } from "./router"

const gridTemplate = `
  "sidebar list header header" auto
  "sidebar list main details" 1fr
  "sidebar list footer footer" auto / min-content min-content 1fr min-content
`

export const App = () => {
  return (
    <ErrorBoundary class="text(base neutral-12)">
      <div class="grid h-screen" style={{ gridTemplate }}>
        <Sidebar />
        <router.currentRoute.component params={router.params} />
      </div>

      <ModalBackdrop />
    </ErrorBoundary>
  )
}
