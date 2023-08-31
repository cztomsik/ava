import { Link } from "."

export const Button = ({ class: className = "", submit = false, primary = submit, ...props }) => {
  props.type = submit ? "submit" : "button"

  props.class = `border rounded-md inline-flex items-center justify-center px-3 py-1.5 text-sm bg-gradient-to-b ${
    primary
      ? "bg-blue-500 from-blue-400 text-neutral-100 border-blue-400 dark:(bg-blue-700 text-white)"
      : "bg-neutral-100 from-white text-neutral-900 border-neutral-200 shadow-thin dark:from-neutral-700"
  } ${className}`

  return props.href ? <Link {...props} /> : <button {...props} />
}
