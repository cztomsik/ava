export const PageContent = ({ children }) => {
  return (
    <div class="overflow-y-auto px-10 py-4">
      <div class="vstack" style="min-height: 100%">
        {children}
      </div>
    </div>
  )
}
