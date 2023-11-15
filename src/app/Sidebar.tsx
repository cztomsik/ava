import { ModelSelect, NavLink, Resizable, SearchField } from "./_components"

export const Sidebar = () => {
  return (
    <Resizable
      as="nav"
      sizes={[150, 200, 400]}
      storageKey="sidebar.width"
      class="[grid-area:sidebar] [box-shadow:inset_-4px_0_4px_-4px_rgba(0,0,0,0.05)] vstack relative p-3 bg-neutral-3 border(r-1 neutral-6)"
      data-drag-window
    >
      {false ? <SearchField class="mt-6 mb-4" /> : <div class="mt-6" />}

      <SidebarHeader title="Main" />
      <SidebarLink href="/chat">Chat</SidebarLink>
      <SidebarLink href="/quick-tools">Quick Tools</SidebarLink>
      {NEXT && <SidebarLink href="/workflows">Workflows</SidebarLink>}
      <SidebarLink href="/playground">Playground</SidebarLink>

      <SidebarHeader title="Other" class="mt-6" />
      <SidebarLink href="/settings">Settings</SidebarLink>

      <SidebarHeader title="Get in touch" class="mt-6" />
      <SidebarLink href="https://twitter.com/cztomsik">Twitter</SidebarLink>
      <SidebarLink href="https://discord.com/invite/C47qUJPkkf">Discord</SidebarLink>

      <SidebarHeader title="Model" class="mt-auto" />
      <ModelSelect />
    </Resizable>
  )
}

const SidebarHeader = ({ title, class: className = "" }) => (
  <h2 class={`pl-3 mb-2 font-bold text(xs neutral-9) ${className}`}>{title}</h2>
)

const SidebarLink = props => (
  <NavLink class="rounded font-semibold py-1.5 px-3 mb-1.5 text-neutral-12" activeClass="bg-neutral-5" {...props} />
)
