import { useMemo } from "preact/hooks"
import { Table } from "."
import { css } from "@twind/core"

const headings = ["text-2xl", "text-xl", "text-lg", "text-base", "text-base", "text-base"]

const styles = css`
  ${headings.map((h, i) => `& h${i + 1} { @apply font-bold ${h}; }`).join("\n")}
  ${headings.map((_, i) => `& h${i + 1} + br { display: none; }`).join("\n")}

  & strong {
    @apply font-bold;
  }

  & em {
    @apply font-italic;
  }

  & code {
    @apply font-mono;
  }

  & a {
    @apply text-blue-500;
  }

  & pre {
    @apply font-mono rounded p-2 my-2 bg-gray-800 text-gray-100 dark:(bg-gray-800 text-gray-100 border(& gray-600);
  }

  &,
  & * {
    cursor: text;
    user-select: auto;
    -webkit-user-select: auto;
  }
`

/**
 * Renders a subset of markdown
 */
export const Markdown = ({ input, class: className = "", ...props }) => {
  const nodes = useMemo(() => {
    try {
      return parse(input)
    } catch (e) {
      console.error(e)
      return <pre>{input}</pre>
    }
  }, [input])

  // TODO: I've seen once that preact failed to properly diff nodes
  //       if that happens again, we might need to use a key here
  //       (and do some incremental parsing, which would be nice anyway)
  return (
    <div class={`${styles} ${className}`} {...props}>
      {nodes}
    </div>
  )
}

// TODO: maybe we can always cache calls to parse()
//       and optimize any sub-calls? get rid of target to make it immutable?

/**
 * Parse markdown into a list of vnodes
 */
const parse = (input, target = []) => {
  let match, pos

  // Match regex and set match
  const p = (pattern: RegExp, render) => {
    pattern.lastIndex = pos
    const m = pattern.exec(input)

    if (m && m.index < (match?.index ?? Infinity)) {
      match = { pattern, render, captures: m.slice(1), index: m.index, length: m[0].length }
    }
  }

  for (input = input.trim(), pos = 0; pos < input.length; match = null) {
    // Basic formatting
    p(/\\(.)/g, ch => ch) // Escape
    p(/(  |\\)\n/g, () => <br />) // Line ends with 2 spaces or a backslash
    p(/^(---|\*\*\*|___)\n/gm, () => <hr />)
    p(/(__|\*\*)(.*?)\1/g, (_, text) => <strong>{parse(text)}</strong>)
    p(/(_|\*)(.*?)\1/g, (_, text) => <em>{parse(text)}</em>)
    p(/~~(.*?)~~/g, text => <s>{parse(text)}</s>)
    p(/!\[(.*?)\]\((.*?)(\s.*)?\)/g, (alt, src) => <img src={src} alt={alt} />)
    p(/`([^`]+)`/g, text => <code>{text}</code>)
    p(/\[(.*?)\]\((.*?)\)/g, (children, href) => <a {...{ href, children }} />)

    // Code blocks
    p(/```.*?\n([\s\S]*?)```/g, text => <pre>{text}</pre>)

    // Heading
    p(/^(#{1,6}) (.*)$/gm, (prefix, text, l = prefix.length, H: any = `h${l}`) => <H>{parse(text)}</H>)

    // Lists
    p(/^(((\s*((\*|\+|\-)|\d(\.|\))) [^\n]+)\n)+)/gm, m => parseList(m))

    // TODO: Paragraphs
    p(/\n/g, () => <br />)

    // Tables
    p(/(\| .* \|\n\| -[-| :]*\|\n(\| .* \|\n)+)/g, m => parseTable(m))

    // Push any text before the match
    if (match?.index > pos) {
      target.push(input.slice(pos, match.index))
    }

    // We're done
    if (!match) {
      target.push(input.slice(pos))
      break
    }

    // Push the match
    target.push(match.render(...match.captures))
    if (match.index + match.length === pos) throw (console.log(match), new Error(`Unexpected match`))
    pos = match.index + match.length
  }

  return target
}

const parseList = (input, level = 0) => {
  const lines = input.split("\n").filter(Boolean)
  const stack = [mkList(/^\s*\d/.test(input))]

  for (const l of lines) {
    const [_, indent, ord, rest] = l.match(/^(\s*)(\d)?\S+ (.*)$/)

    if (indent.length > level) {
      level = indent.length
      stack.push(mkList(!!ord))
    }

    if (indent.length < level) {
      level = indent.length
      const prev = stack.pop()
      stack[stack.length - 1].props.children.push(prev)
    }

    stack[stack.length - 1].props.children.push(<li>{parse(rest)}</li>)
  }

  return stack
}

const mkList = ord =>
  ord ? <ol class="py-2 ml-4 list-decimal" children={[]} /> : <ul class="py-2 ml-4 list-disc" children={[]} />

// TODO: we can cache this and preact will skip diffing then
const parseTable = input => {
  const lines = input.trim().split("\n")
  const cells = lines.map(row => row.slice(1, -1).split("|"))
  const [head, _, ...body] = cells

  return (
    <Table>
      <thead>
        <tr>
          {head.map(cell => (
            <th>{parse(cell)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map(row => (
          <tr>
            {row.map(cell => (
              <td>{parse(cell)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}
