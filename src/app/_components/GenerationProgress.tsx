import { useRef } from "preact/hooks"
import { Button } from "."

export const GenerationProgress = ({ data, abort, class: className = "" }) => {
  const ref = useRef(null)

  data.subscribe(() => ref.current?.scrollIntoView({ behavior: "smooth" }))

  return (
    // mb-0.5 is for the button shadow which would otherwise be cut off during scrolling
    // otherwise we don't want to set any margin because this component is always
    // used differently
    <div ref={ref} class={`hstack mb-0.5 ${className}`}>
      {data.value && <Button onClick={abort}>Stop generation</Button>}
      <div class="ml-4">{data.value?.status}</div>
      <i class="h-8" />
    </div>
  )
}
