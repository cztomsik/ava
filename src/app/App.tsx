import { ErrorBoundary, Layout, ModalBackdrop } from "./_components"
import { Sidebar } from "./Sidebar"
import { router } from "./router"

export const App = () => {
  return (
    <ErrorBoundary class="text(base neutral-12)">
      <Layout class="h-screen">
        <Sidebar />
        <router.currentRoute.component params={router.params} />
      </Layout>

      <ModalBackdrop />
    </ErrorBoundary>
  )
}
