export const PageHeader = ({ title, description = "", children = null }) => {
  return (
    <header class="flex(& wrap) items-end px(4 lg:10) py-2 border(b-1 neutral-200 dark:neutral-700)" data-drag-window>
      <h2 class="mt-10 mr-4 text-2xl font-semibold">{title}</h2>
      <p class="text(sm neutral-500) mr-auto">{description}</p>

      {children}
    </header>
  )
}
