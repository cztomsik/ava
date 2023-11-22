import { Link } from "./Link"

export const Button = ({ class: className = "", submit = false, primary = submit, text = false, ...props }) => {
  props.type = submit ? "submit" : "button"

  props.class = `btn ${className} ${
    text
      ? "px-1"
      : primary
      ? "bg-primary-9 from-primary(8 dark:10) text-white border-primary-9"
      : "bg-neutral-4 from-neutral(1 dark:8) text-neutral-12 border-neutral-6 [box-shadow:0_1px_1px_0_rgba(0,0,0,0.3)]"
  }`

  return props.href ? <Link {...props} /> : <button {...props} />
}
