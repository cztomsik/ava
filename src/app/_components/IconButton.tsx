import { Button } from "./Button"
import { Icon } from "./Icon"

export const IconButton = ({ class: className = "", icon, ...props }) => {
  return (
    <Button class={`text-neutral-11 ${className}`} text {...props}>
      <Icon icon={icon} />
    </Button>
  )
}
