import { ErrorBoundary, ModalBackdrop } from "./_components"
import { Sidebar } from "./Sidebar"
import { router } from "./router"

export const App = () => {
  return (
    <ErrorBoundary class="text(base neutral-12)">
      <div class="grid grid-cols-[auto_1fr] h-screen">
        <Sidebar />
        <router.currentRoute.component params={router.params} />
      </div>

      <ModalBackdrop />
    </ErrorBoundary>
  )
}
