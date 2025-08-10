import { Marked } from "marked"
import { useEffect, useRef } from "preact/hooks"
import { effect } from "@preact/signals"

const marked = new Marked({
  renderer: {
    html: _ => "",
  },
})

export const Markdown = ({ input, class: className = "", ...props }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => effect(() => (ref.current!.innerHTML = marked.parse("" + input) as string)), [input])

  return <div ref={ref} class={`overflow-x-hidden markdown ${className}`} {...props} />
}
