export const PageHeader = ({ title, children = null }) => {
  return (
    <header
      class="flex(& wrap) gap-2 items-end px(4 lg:6) py-2 border(b-1 neutral-200 dark:neutral-700)"
      data-drag-window
    >
      <h2 class="mt-2 mr-auto text-xl font-medium">{title}</h2>

      {children}
    </header>
  )
}

export const PageContent = ({ class: className = "", ...props }) => (
  <div class={`vstack max-w-full overflow-x-hidden overflow-y-auto p-4 lg:(py-6 px-6) ${className}`} {...props} />
)

export const PageFooter = ({ class: className = "", ...props }) => (
  <footer class={`p-4 lg:px-6 ${className}`} {...props} />
)
