export const PageHeader = ({ title, description = "", children = null }) => {
  return (
    <header class="flex items-end px-4 lg:px-10 py-2 border-b-1 border-neutral-200" data-drag-window>
      <h2 class="mt-10 text-2xl font-semibold">{title}</h2>
      <p class="ml-4 text-sm text-neutral-500">{description}</p>

      {children}
    </header>
  )
}
