import { useMemo } from "preact/hooks"
import { Table } from "."

const headings = ["text-2xl", "text-xl", "text-lg"]

/**
 * Renders a subset of markdown
 */
export const Markdown = ({ input, ...props }) => {
  const nodes = useMemo(() => {
    try {
      return parse(input)
    } catch (e) {
      console.error(e)
      return <pre>{input}</pre>
    }
  }, [input])

  return <div {...props}>{nodes}</div>
}

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
    p(/(__|\*\*)(.*?)\1/g, (_, text) => <strong class="font-bold">{parse(text)}</strong>)
    p(/(_|\*)(.*?)\1/g, (_, text) => <em class="font-italic">{parse(text)}</em>)
    p(/~~(.*?)~~/g, text => <s>{parse(text)}</s>)
    p(/\[(.*?)\]\((.*?)\)/g, (text, href) => <a href={href}>{parse(text)}</a>)
    p(/!\[(.*?)\]\((.*?)(\s.*)?\)/g, (alt, src) => <img src={src} alt={alt} />)
    p(/`([^`]+)`/g, text => <code class="font-mono">{text}</code>)
    p(/```.*?\n([\s\S]*?)```/g, text => <pre class="font-mono rounded p-2 my-2 bg-gray-800 text-gray-100">{text}</pre>)

    // Heading
    p(/^(#{1,6}) (.*)$/gm, (prefix, text, l = prefix.length, H: any = `h${l}`) => (
      <H class={`font-bold mb-2 ${headings[l - 1] ?? ""}`}>{parse(text)}</H>
    ))

    // Lists
    // p(/^(\s*)(\+|-|\*|\d+\.) /gm
    // p(/(?:^|\n)((?:(-|\d+\.) .+(?:\n|$))+)/g, (m, ch, List: any = ch == "-" ? "ul" : "ol") => (
    //   <List>
    //     {console.log([m, ch, List])}
    //     {m
    //       .trim()
    //       .split("\n")
    //       .map(line => (
    //         <li>{parse(line.slice(2))}</li>
    //       ))}
    //   </List>
    // ))

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
