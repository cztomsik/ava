export const PageHeader = ({ title, children = null }) => {
  return (
    <header class="flex(& wrap) gap-2 items-end px-3 py-2 lg:pl-6 border(b-1 neutral-6)" data-drag-window>
      <h2 class="mt-2 mr-auto text(xl primary-12) font-medium">{title}</h2>

      {children}
    </header>
  )
}

export const PageContent = ({ class: className = "", ...props }) => (
  <div class={`vstack max-w-full overflow-x-hidden overflow-y-auto p-3 lg:pl-6 ${className}`} {...props} />
)

export const PageFooter = ({ class: className = "", ...props }) => (
  <footer class={`p-3 lg:pl-6 ${className}`} {...props} />
)
