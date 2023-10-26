import { Button } from "./Button"

export const GenerationProgress = ({ status, abort, class: className = "" }) => {
  return (
    // mb-0.5 is for the button shadow which would otherwise be cut off during scrolling
    // otherwise we don't want to set any margin because this component is always
    // used differently
    <div class={`hstack mb-0.5 ${className}`}>
      {status.value && <Button onClick={abort}>Stop generation</Button>}
      <div class="ml-4">{status.value}</div>
    </div>
  )
}
