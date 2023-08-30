export const PageContent = ({ children }) => {
  return (
    <div class="overflow-y-auto p-4 lg:px-10">
      <div class="vstack" style="min-height: 100%">
        {children}
      </div>
    </div>
  )
}
