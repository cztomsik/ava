import { Resizable } from "./Resizable"

const gridTemplate = `
  "list header header" auto
  "list subhead subhead" auto
  "list main details" 1fr
  "list footer details" auto / min-content 1fr min-content
`

const Page = ({ children }) => (
  <div class="grid h-screen" style={{ gridTemplate }}>
    {children}
  </div>
)

Page.Header = ({ title, children = null as any, ...props }) => {
  return (
    <header
      class="[grid-area:header] h-12 flex items-center gap-2 pl-4 pr-3 border-b border-neutral-6 min-w-0"
      data-drag-window
      {...props}
    >
      <h2 class="mt-0.5 flex-1 text-lg text-primary-12 font-medium truncate">{title}</h2>

      {children}
    </header>
  )
}

Page.SubHead = ({ class: className = "", ...props }) => (
  <div class={`[grid-area:subhead] bg-neutral-2 p-8 border-b border-neutral-6 ${className}`} {...props} />
)

Page.List = ({ class: className = "", as: Comp, sizes, ...props }) => (
  <Resizable as="nav" sizes={sizes} storageKey="TODO" class={`[grid-area:list] overflow-hidden ${className}`}>
    <Comp class="h-full max-h-full" {...props} />
  </Resizable>
)

Page.Content = ({ class: className = "", ...props }) => (
  <div class={`[grid-area:main] vstack max-w-full overflow-x-hidden overflow-y-auto p-3 pl-4 ${className}`} {...props} />
)

Page.DetailsPane = ({ class: className = "", sizes, ...props }) => (
  <Resizable
    rtl
    sizes={sizes}
    class={`[grid-area:details] border-l border-neutral-6 vstack overflow-x-hidden overflow-y-auto ${className}`}
    {...props}
  />
)

Page.Footer = ({ class: className = "", ...props }) => (
  <footer class={`[grid-area:footer] p-3 pl-4 ${className}`} {...props} />
)

export { Page }
