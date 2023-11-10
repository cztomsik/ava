import { ErrorBoundary, ModalBackdrop } from "./_components"
import { Sidebar } from "./Sidebar"
import { router } from "./router"

import { css } from "@twind/core"

export const grid = css`
  @apply grid h-screen;

  grid-template-columns: min-content min-content 1fr min-content;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "sidebar list header header"
    "sidebar list main details"
    "sidebar list footer footer";
`

export const App = () => {
  return (
    <ErrorBoundary class="text(base neutral-12)">
      <div class={grid}>
        <Sidebar />
        <router.currentRoute.component params={router.params} />
      </div>

      <ModalBackdrop />
    </ErrorBoundary>
  )
}
