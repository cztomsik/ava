export const PageHeader = ({ title, children = null }) => {
  return (
    <header
      class="flex(& wrap) gap-2 items-end px(4 lg:10) py-2 border(b-1 neutral-200 dark:neutral-700)"
      data-drag-window
    >
      <h2 class="mt-10 mr-2 text-2xl font-semibold">{title}</h2>

      {children}
    </header>
  )
}
