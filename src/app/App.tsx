import { ErrorBoundary, Layout, ModalBackdrop, ModelSelect, NavLink, SearchField } from "./_components"
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

const Sidebar = () => (
  <aside class="vstack gap-2 p-3 bg-neutral-2 border(r-1 neutral-6) shadow-inner" data-drag-window>
    {EXP ? <SearchField class="mt-6 mb-4" /> : <div class="mt-4" />}

    <SidebarHeader title="Main" />
    <SidebarLink href="/chat">Chat</SidebarLink>
    {EXP && <SidebarLink href="/quick-tools">Quick Tools</SidebarLink>}
    <SidebarLink href="/playground">Playground</SidebarLink>

    {EXP && (
      <>
        <SidebarHeader title="Pinned" />
        <SidebarLink href="/pinned/1">Copywriting</SidebarLink>
        <SidebarLink href="/pinned/2">Debugging</SidebarLink>
      </>
    )}

    <SidebarHeader title="Other" class="mt-6" />
    <SidebarLink href="/settings">Settings</SidebarLink>

    <SidebarHeader title="Model" class="mt-auto" />
    <ModelSelect class="mt-2 w(40 lg:52)" />
  </aside>
)

const SidebarHeader = ({ title, class: className = "" }) => (
  <h2 class={`pl-3 font-bold text(xs neutral-9) ${className}`}>{title}</h2>
)

const SidebarLink = props => (
  <NavLink class="rounded font-semibold py-2 px-3 text-neutral-12" activeClass="bg-neutral-5" {...props} />
)

const BuyButton = () =>
  EXP && (
    <a class="me-2" href="http://www.avapls.com/">
      Buy License
    </a>
  )
