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

const sampleMd = `
# Heading 1
## Heading 2
### Heading 3

Some text with **bold** and *italic text*.

- Item 1
- Item 2
- Item 3

1. Numbered 1
2. Numbered 2
3. Numbered 3

> This is a blockquote

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

[Link](https://github.com/cztomsik/ava)`

export const MarkdownExample = () => {
  return (
    <div class="border border-neutral-6 rounded p-4">
      <Markdown input={sampleMd} />
    </div>
  )
}
