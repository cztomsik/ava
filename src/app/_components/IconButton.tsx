import { Button } from "./Button"
import { X } from "lucide"

export const IconButton = ({ class: className = "", icon, ...props }) => {
  const svg = toVdom(icon)

  return (
    <Button class={`!px-1 text-neutral-11 ${className}`} text {...props}>
      {svg}
    </Button>
  )
}

const toVdom = ([Tag, attrs, children = null]) => <Tag {...attrs}>{children?.map(toVdom)}</Tag>

// TODO: fix this hack
X[1].width = X[1].height = 20
X[1]["stroke-width"] = 1.75
