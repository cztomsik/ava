export const Alert = ({ class: className = "", children }) => {
  return (
    <div className={`p-3 rounded-md border-1 border-neutral-300 ${className}`} role="alert">
      {children}
    </div>
  )
}
