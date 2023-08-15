import { useMemo } from "preact/hooks"
import MarkdownIt from "markdown-it/dist/markdown-it.min.js"

const md = new MarkdownIt()
md.renderer.rules.table_open = function () {
  return '<table class="table table-striped table-bordered">\n'
}

export const Markdown = ({ input, ...props }) => {
  const __html = useMemo(() => md.render(input).replace(/&lt;br&gt;/g, "<br>"), [input])

  return <div dangerouslySetInnerHTML={{ __html }} {...props} />
}
