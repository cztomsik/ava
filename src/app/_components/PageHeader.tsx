export const PageHeader = ({ title, children = null }) => {
  return (
    <header
      class="flex(& wrap) gap-2 items-end px(4 lg:10) py-2 border(b-1 neutral-200 dark:neutral-700)"
      data-drag-window
    >
      <h2 class="mt-2 mr-auto text-xl font-medium">{title}</h2>

      {children}
    </header>
  )
}
