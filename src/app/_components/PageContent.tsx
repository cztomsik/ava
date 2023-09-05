export const PageContent = ({ class: className = "", children }) => (
  <div class={`vstack max-w-full overflow-x-hidden overflow-y-auto p-4 lg:(py-6 px-10) ${className}`}>{children}</div>
)
