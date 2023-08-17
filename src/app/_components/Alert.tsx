export const Alert = ({ children, type = "info" }) => {
  return (
    <div className={`alert alert-${type}`} role="alert">
      {children}
    </div>
  )
}
