export const PageHeader = ({ title, description = "", children = null }) => {
  return (
    <header class="flex items-end px-10 py-2 border-b-1 border-neutral-200">
      <h2 class="mt-10 text-2xl font-semibold">{title}</h2>

      {children}
    </header>
  )
}
