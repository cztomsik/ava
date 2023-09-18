import { Link } from "."

export const Button = ({ class: className = "", submit = false, primary = submit, ...props }) => {
  props.type = submit ? "submit" : "button"

  props.class = `border rounded-md inline-flex items-center justify-center px-3 py-1.5 text-sm bg-gradient-to-b ${
    primary
      ? "bg-primary(10 dark:11) from-primary(8 dark:9) text-sky(1 dark:4) border-primary(8 dark:10)"
      : "bg-neutral-5 from(white dark:neutral-11) text-neutral-12 border-neutral-6 shadow-thin"
  } ${className}`

  return props.href ? <Link {...props} /> : <button {...props} />
}
