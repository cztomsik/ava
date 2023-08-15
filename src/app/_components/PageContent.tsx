export const PageContent = ({ children }) => {
  return (
    <div class="overflow-y-auto">
      <div class="container my-4">{children}</div>
    </div>
  )
}
