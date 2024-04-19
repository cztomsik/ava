import { Link } from "./Link"
import { Icon } from "./Icon"
import { StopCircle } from "lucide"

export const Button = ({
  class: className = "",
  submit = false,
  primary = submit,
  text = false,
  loading = false,
  abort = undefined as any,
  ...props
}) => {
  props.type = submit ? "submit" : "button"

  props.class = `h-8 border rounded-md inline-flex items-center justify-center px-${text ? 1 : 3} text-sm bg-gradient-to-b ${
    text
      ? "border-transparent"
      : primary
      ? "bg-primary(10 dark:11) from-primary(8 dark:9) text-sky(1 dark:4) border-primary(8 dark:10)"
      : "bg-neutral-5 from(white dark:neutral-11) text-neutral-12 border-neutral-6 shadow-thin"
  } active:[translate:1px_1px] ${className}`

  if (loading) {
    props.disabled = !abort
    props.children = <Icon.Spinner />
  }

  if (abort) {
    props.onClick = e => (e.preventDefault(), abort())
    props.children = <Icon icon={StopCircle} />
  }

  return props.href ? <Link {...props} /> : <button {...props} />
}

export const ButtonGroup = ({ class: className = "", ...props }) => (
  <div class={`flex [&>*]:rounded-none ${className}`} role="group" {...props} />
)

export const IconButton = ({ class: className = "", icon, disabled = false, ...props }) => (
  <Button class={`text-neutral-${disabled ? 5 : 11} ${className}`} text disabled={disabled} {...props}>
    <Icon icon={icon} />
  </Button>
)
