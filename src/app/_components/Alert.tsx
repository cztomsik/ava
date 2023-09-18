export const Alert = ({ class: className = "", children }) => {
  return (
    <div className={`p-3 rounded-md bg(warning-2) border(1 warning-6) text-warning(11) ${className}`} role="alert">
      {children}
    </div>
  )
}
