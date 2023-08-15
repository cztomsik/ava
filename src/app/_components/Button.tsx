import { Link } from "."

export const Button = ({ class: className = "", submit = false, primary = submit, ...props }) => {
  props.type = submit ? "submit" : "button"
  props.class = `btn ${primary ? "btn-primary" : "btn-outline-secondary"} ${className}`

  // @ts-expect-error
  return props.href ? <Link {...props} /> : <button {...props} />
}
