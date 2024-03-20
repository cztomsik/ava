import { Marked } from "marked"
import { css } from "@twind/core"
import { useEffect, useRef } from "preact/hooks"
import { effect } from "@preact/signals"

const marked = new Marked({
  renderer: {
    html: _ => "",
  },
})

const headings = ["text-2xl", "text-xl", "text-lg", "text-base", "text-base", "text-base"]

const styles = css`
  ${headings.map((h, i) => `& h${i + 1} { @apply font-bold ${h}; }`).join("\n")}

  & hr {
    @apply my-4 border-t border-neutral-8;
  }

  & p {
    @apply mb-2;
  }

  & strong {
    @apply font-bold;
  }

  & em {
    @apply font-italic;
  }

  & code {
    @apply text-sm font(mono semibold);
  }

  & a {
    cursor: pointer;
    @apply text-blue-11;
  }

  & pre {
    @apply overflow-auto text-sm font-mono rounded p-2 my-2 bg-neutral-12 text-neutral-2 dark:(bg-neutral-12 text-neutral-2 border(& neutral-10);
  }

  & ul {
    @apply list-disc py-2 pl-5;
  }

  & ol {
    @apply list-decimal py-2 pl-5;
  }

  &,
  & * {
    cursor: text;
    user-select: auto;
  }
`

export const Markdown = ({ input, class: className = "", ...props }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => effect(() => (ref.current!.innerHTML = marked.parse("" + input) as string)), [input])

  return <div ref={ref} class={`overflow-x-hidden ${styles} ${className}`} {...props} />
}
