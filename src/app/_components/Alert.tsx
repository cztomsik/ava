export const Alert = ({ class: className = "", children }) => {
  return (
    <div
      className={`p-3 rounded-md bg(yellow-50 dark:neutral-800) border(1 yellow-300 dark:yellow-800) text-yellow(800 dark:300) ${className}`}
      role="alert"
    >
      {children}
    </div>
  )
}
