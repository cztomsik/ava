/**
 * Simple mustache-like template engine:
 * - no loops, partials, lambdas, etc.
 * - just variables, sections and inverted sections
 */
export const template = (tpl: string, data: Record<string, any>) => {
  let depth = 0
  let stack = [{ key: "", inverted: false, inner: "" }]

  for (const [_, prev, op, key] of tpl.matchAll(/([\s\S]*?)(?:{{\s*(#|\^|\/)(.*?)\s*}}|$)/g)) {
    stack[depth].inner += prev.replace(/{{\s*(.*?)\s*}}/g, (_, k) => data[k] ?? "")

    if (op === "/") {
      if (key != stack[depth].key) {
        throw new Error()
      }

      const section = stack.pop()
      stack[--depth].inner += (section.inverted ? !data[key] : data[key]) ? section.inner : ""
      continue
    }

    if (op) {
      stack[++depth] = { key, inverted: op === "^", inner: "" }
    }
  }

  if (depth !== 0 || stack.length > 1) {
    throw new Error()
  }

  return stack[depth].inner
}

/**
 * Extracts all variables from a template
 */
export const parseVars = (tpl: string) => [
  ...new Set(Array.from(tpl.matchAll(/{{\s*(?:#|\^|\/)?(.*?)\s*}}/g), m => m[1])),
]
