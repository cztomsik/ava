const Page = ({ children }) => <>{children}</>

const PageHeader = ({ title, children = null, ...props }) => {
  return (
    <header
      class="flex(& max-sm:wrap) gap-2 items-end pl-4 pr-3 py-2 border(b-1 neutral-6) min-w-0"
      data-drag-window
      {...props}
    >
      <h2 class="mt-2 flex-1 text(xl primary-12 ellipsis) font-medium overflow-hidden whitespace-nowrap">{title}</h2>

      {children}
    </header>
  )
}

const PageContent = ({ class: className = "", ...props }) => (
  <div class={`vstack max-w-full overflow-x-hidden overflow-y-auto p-3 pl-4 ${className}`} {...props} />
)

const PageFooter = ({ class: className = "", ...props }) => <footer class={`p-3 pl-4 ${className}`} {...props} />

export { Page }
Page.Header = PageHeader
Page.Content = PageContent
Page.Footer = PageFooter
