export const Alert = ({ class: className = "", children }) => {
  return (
    <div class={`p-4 rounded-md bg-warning-2 border border-warning-8 text-warning-12 ${className}`} role="alert">
      {children}
    </div>
  )
}

export const AlertExample = () => <Alert>Hello World!</Alert>
