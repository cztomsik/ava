import { Link } from "."

export const Button = ({
  class: className = "",
  submit = false,
  primary = submit,
  color = primary ? "blue" : "gray",
  ...props
}) => {
  props.type = submit ? "submit" : "button"
  props.class = `btn text-${color}-700 border-${color}-500 ${className}`

  // @ts-expect-error
  return props.href ? <Link {...props} /> : <button {...props} />
}
