export const PageContent = ({ children }) => {
  return (
    <div class="vstack overflow-x-hidden overflow-y-auto p-4 lg:(py-6 px-10)">
      <div class="vstack" style="min-height: 100%">
        {children}
      </div>
    </div>
  )
}
