import { h } from "preact"
import { useMemo } from "preact/hooks"
import { exec, useRouter } from "preact-router"
import MarkdownIt from "markdown-it/dist/markdown-it.min.js"
import { history } from "./App"

const md = new MarkdownIt()
md.renderer.rules.table_open = function () {
  return '<table class="table table-striped table-bordered">\n'
}

export const Link = props => {
  const [router] = useRouter()

  if (exec(props.href, router.path ? router.url : history.location.pathname, {})) {
    props = { ...props, class: (props.class || "") + " active" }
  }

  return <a {...props} />
}

export const Markdown = ({ input }) => {
  const __html = useMemo(() => md.render(input), [input])

  return <div dangerouslySetInnerHTML={{ __html }} />
}
