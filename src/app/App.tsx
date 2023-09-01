import { ErrorBoundary, Layout, ModelSelect, NavLink, SearchField } from "./_components"
import { router } from "./router"

export const App = () => {
  return (
    <ErrorBoundary class="text(base neutral-900) bg(white dark:neutral-800)">
      <Layout class="h-screen">
        <Sidebar />

        <Layout>
          <router.currentRoute.component params={router.params} />
        </Layout>
      </Layout>
    </ErrorBoundary>
  )
}

const Sidebar = () => (
  <aside class="vstack gap-2 p-4 bg-neutral(100 dark:700) border(r-1 neutral-300) shadow-inner" data-drag-window>
    {DEV ? <SearchField class="mt-6 mb-4" /> : <div class="mt-4" />}

    <SidebarHeader title="Main" />
    <SidebarLink href="/chat">Chat</SidebarLink>
    {DEV && <SidebarLink href="/quick-tools">Quick Tools</SidebarLink>}
    <SidebarLink href="/playground">Playground</SidebarLink>

    {DEV && (
      <>
        <SidebarHeader title="Pinned" />
        <SidebarLink href="/pinned/1">Copywriting</SidebarLink>
        <SidebarLink href="/pinned/2">Debugging</SidebarLink>
      </>
    )}

    <SidebarHeader title="Other" />
    <SidebarLink href="/settings">Settings</SidebarLink>

    <SidebarHeader title="Model" class="mt-auto" />
    <ModelSelect class="mt-2 w(40 lg:52)" />
  </aside>
)

const SidebarHeader = ({ title, class: className = "" }) => (
  <h2 class={`mt-6 ml-3 font-bold text(xs gray-400 dark:gray-400) ${className}`}>{title}</h2>
)

const SidebarLink = props => (
  <NavLink class="rounded font-semibold py-2 px-3 text-neutral-900" activeClass="bg-neutral(200 dark:600)" {...props} />
)

const BuyButton = () =>
  DEV && (
    <a class="me-2" href="http://www.avapls.com/" target="_blank">
      Buy License
    </a>
  )
