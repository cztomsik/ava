export const Alert = ({ class: className = "", children }) => {
  return (
    <div className={`p-4 rounded-md bg(warning-2) border(1 warning-8) text-warning(12) ${className}`} role="alert">
      {children}
    </div>
  )
}
