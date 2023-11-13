import { ErrorBoundary, ModalBackdrop } from "./_components"
import { Sidebar } from "./Sidebar"
import { router } from "./router"

const grid = {
  gridTemplateColumns: "min-content min-content 1fr min-content",
  gridTemplateRows: "auto 1fr auto",
  gridTemplateAreas: `
    "sidebar list header header"
    "sidebar list main details"
    "sidebar list footer footer"
  `,
}

export const App = () => {
  return (
    <ErrorBoundary class="text(base neutral-12)">
      <div class="grid h-screen" style={grid}>
        <Sidebar />
        <router.currentRoute.component params={router.params} />
      </div>

      <ModalBackdrop />
    </ErrorBoundary>
  )
}
