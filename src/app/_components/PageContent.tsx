export const PageContent = ({ children }) => {
  return (
    <div class="overflow-y-auto py-4">
      <div class="container vstack" style="min-height: 100%">
        {children}
      </div>
    </div>
  )
}
