import { Button } from "./Button"
import { Icon } from "./Icon"

export const IconButton = ({ class: className = "", icon, disabled = false, ...props }) => {
  return (
    <Button class={`text-neutral-${disabled ? 5 : 11} ${className}`} text disabled={disabled} {...props}>
      <Icon icon={icon} />
    </Button>
  )
}
