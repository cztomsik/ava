import { ModelSelect, NavLink, SearchField } from "./_components"
import { useLocalStorage, useResize } from "./_hooks"

export const Sidebar = () => {
  const width = useLocalStorage("sidebar.width", 200)
  const { style, resizeHandle } = useResize({ width, minWidth: 150, maxWidth: 400 })

  return (
    <aside class="vstack relative p-3 bg-neutral-2 border(r-1 neutral-6) shadow-inner" style={style} data-drag-window>
      {NEXT ? <SearchField class="mt-6 mb-4" /> : <div class="mt-6" />}

      <SidebarHeader title="Main" />
      <SidebarLink href="/chat">Chat</SidebarLink>
      {NEXT && <SidebarLink href="/quick-tools">Quick Tools</SidebarLink>}
      <SidebarLink href="/playground">Playground</SidebarLink>

      {NEXT && (
        <>
          <SidebarHeader title="Pinned" />
          <SidebarLink href="/pinned/1">Copywriting</SidebarLink>
          <SidebarLink href="/pinned/2">Debugging</SidebarLink>
        </>
      )}

      <SidebarHeader title="Other" class="mt-6" />
      <SidebarLink href="/settings">Settings</SidebarLink>

      <SidebarHeader title="Get in touch" class="mt-6" />
      <SidebarLink href="https://twitter.com/cztomsik">Twitter</SidebarLink>
      <SidebarLink href="https://discord.com/invite/C47qUJPkkf">Discord</SidebarLink>

      <SidebarHeader title="Model" class="mt-auto" />
      <ModelSelect />

      {resizeHandle}
    </aside>
  )
}

const SidebarHeader = ({ title, class: className = "" }) => (
  <h2 class={`pl-3 mb-2 font-bold text(xs neutral-9) ${className}`}>{title}</h2>
)

const SidebarLink = props => (
  <NavLink class="rounded font-semibold py-1.5 px-3 mb-2 text-neutral-12" activeClass="bg-neutral-5" {...props} />
)

// or donate/sponsor?
const BuyButton = () =>
  NEXT && (
    <a class="me-2" href="http://www.avapls.com/">
      Buy License
    </a>
  )
