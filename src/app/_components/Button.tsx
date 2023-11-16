import { Link } from "./Link"

export const Button = ({ class: className = "", submit = false, primary = submit, text = false, ...props }) => {
  props.type = submit ? "submit" : "button"

  props.class = `h-8 border-1 rounded-md inline-flex items-center justify-center px-${
    text ? 1 : 3
  } text-sm bg-gradient-to-b ${
    text
      ? "border-transparent"
      : primary
      ? "bg-primary(10 dark:11) from-primary(8 dark:9) text-sky(1 dark:4) border-primary(8 dark:10)"
      : "bg-neutral-5 from(white dark:neutral-11) text-neutral-12 border-neutral-6 [box-shadow:0_1px_1px_0_rgba(0,0,0,0.3)]"
  } ${className}`

  return props.href ? <Link {...props} /> : <button {...props} />
}
