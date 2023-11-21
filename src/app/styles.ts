// Smallest? Tailwind-like CSS-in-JS library with bindings for Preact
// Copyright (C) 2023 Kamil Tomšík - All Rights Reserved

// prettier-ignore
export const colors = {
  gray: [ "#fcfcfc", "#f9f9f9", "#f0f0f0", "#e8e8e8", "#e0e0e0", "#d9d9d9", "#cecece", "#bbbbbb", "#8d8d8d", "#838383", "#646464", "#202020" ],
  blue: [ "#fbfdff", "#f4faff", "#e6f4fe", "#d5efff", "#c2e5ff", "#acd8fc", "#8ec8f6", "#5eb1ef", "#0090ff", "#0588f0", "#0d74ce", "#113264" ],
  sky: [ "#f9feff", "#f1fafd", "#e1f6fd", "#d1f0fa", "#bee7f5", "#a9daed", "#8dcae3", "#60b3d7", "#7ce2fe", "#74daf8", "#00749e", "#1d3e56" ],
  yellow: [ "#fdfdf9", "#fefce9", "#fffab8", "#fff394", "#ffe770", "#f3d768", "#e4c767", "#d5ae39", "#ffe629", "#ffdc00", "#9e6c00", "#473b1f" ],
}

export const theme = {
  color: (name, [k, v] = name.split("-")) => colors[k]?.[--v] ?? name,
  space: (v, p = "w") => ({ auto: "auto", px: "1px", full: "100%", screen: `100v${p}` }[v] ?? `${v * 0.25}rem`),
  fontSize: v => ({ xs: "12px", sm: "13px", base: "14px", lg: "16px", xl: "18px", "2xl": "20px" }[v]),
  fontWeight: v => ({ medium: 500, semibold: 600 }[v] ?? v),
  lineHeight: v => ({ xs: "1rem", sm: "1rem", base: "1.25rem", lg: "1.5rem", xl: "1.5rem", "2xl": "1.5rem" }[v]),
  rounded: (v = "base") => ({ none: "0", sm: "2px", base: "4px", md: "6px", lg: "8px", full: "999px" }[v]),
}

export const shorthands: Record<string, string> = {
  hstack: "flex flex-row items-center",
  vstack: "flex flex-col",
  "form-control": "inline-flex px-2 py-1.25 bg-neutral-1 border(1 neutral-8) rounded-md",
  truncate: "overflow-hidden text-ellipsis whitespace-nowrap",

  // TODO: later
  hidden: "[display:none]",
  "max-h-full": "[max-height:100%]",
  "max-w-full": "[max-width:100%]",
  "rounded-r-md": "[border-top-right-radius:0.375rem] [border-bottom-right-radius:0.375rem]",
  "shadow-inner": "[box-shadow:inset_0_2px_4px_rgba(0,0,0,0.05)]",
  "max-w-2xl": "[max-width:42rem]",
  "max-w-3xl": "[max-width:48rem]",
  "max-w-5xl": "[max-width:64rem]",
  "min-w-0": "[min-width:0]",
}

type Rule = [RegExp, string] | [RegExp, (match) => string] | [RegExp, string | ((match) => string), string?]
export const rules: Rule[] = [
  // Layout
  [/^(block|flex|grid|(inline|table)(-.*)?)$/, "display"],
  [/^grid-(cols|rows)-(\d+)$/, ([_, p, d]) => `grid-template-${p.replace("col", "column")}: repeat(${d},minmax(0,1fr))`],
  [/^flex-((row|col)(-reverse)?)$/, ([_, v]) => `flex-direction: ${v.replace("col", "column")}`],
  [/^flex-(.+)$/, "flex"],
  [/^gap-(.+)$/, "gap", "space"],
  [/^justify(?:-(\w+))?-(.+)$/, ([_, p = "content", v]) => `justify-${p}: ${v}`],
  [/^(content|items|self)-(.+)$/, ([_, p, v]) => `align-${p}: ${v}`],
  [/^[pm](\w)?-([\w\.]+)$/, ([m, e, v]) => repeat(m[0] === "p" ? "padding" : "margin", edges(e), theme.space(v))],
  [/^[wh]-([\w\.]+)$/, ([m, v]) => `${m[0] === "w" ? "width" : "height"}: ${theme.space(v, m[0])}`],
  [/^(static|relative|absolute|fixed|sticky)$/, "position"],
  // prettier-ignore
  [/^(?:inset-?([xy])?|top|right|left|bottom)-(.+)$/, ([m, e = m[0], v]) => repeat("", edges(e), theme.space(v), "", "inset")],

  // Borders
  [/^rounded(?:-(.+))?$/, "border-radius", "rounded"],
  [/^(border|outline)(?:-(\w))?-(none|\d+)$/, ([_, p, e, d]) => repeat(p, edges(e), `${+d || 0}px`, "-width")],
  [/^(border|outline)-(.+)$/, ([_, p, k, d]) => `${p}-color: ${theme.color(k, d)}`],
  [/^border-(transparent)$/, "border-color"],
  [/^border-(collapse|separate)$/, "border-collapse"],

  // Typography
  [/^text-(left|center|right)$/, "text-align"],
  [/^text-(ellipsis|clip)$/, "text-overflow"],
  [/^text-(\w{2}|\dxl|base)$/, ([_, k]) => `font-size: ${theme.fontSize(k)}; line-height: ${theme.lineHeight(k)}`],
  [/^text-(.+)$/, "color", "color"],
  [/^font-(.+)$/, "font-weight", "fontWeight"],
  [/^((upper|lower|normal-)case|capitalize)$/, "text-transform"],
  [/^whitespace-(.+)$/, "white-space"],
  [/^list-(.+)$/, "list-style-type"],

  // Other
  [/^select-(.+)$/, "user-select"],
  [/^bg-gradient-to-(\w)$/, ([_, e]) => `background-image: linear-gradient(to ${edges(e)[0]}, var(--grad), transparent)`],
  [/^bg-(.+)$/, "background-color", "color"],
  [/^from-(.+)$/, "--grad", "color"],

  [/^((in)?visible|collapse)$/, ([_, h, v]) => `visibility: ${h ? "hidden" : v}`],

  // Pass-through
  // prettier-ignore
  [/^(cursor|fill|opacity|overflow(?:-[xy])?|pointer-events|transition)-(.+)$/, ([_, p, v]) => `${p}: ${v}`],
  [/^\[([\w-]+):(.+)]$/, ([_, p, v]) => `${p}: ${v.replace(/_/g, " ").replace(/\\/g)}`],
]

export const variants = {
  hover: ":hover",
  focus: ":focus",
  even: ":nth-child(even)",
  odd: ":nth-child(odd)",
  before: "::before",
  after: "::after",
  sibling: " + *",
  sibglings: " ~ *",
  children: " > *",
  grandchildren: " > * > *",
  "group-focus": ".group:focus ",
  "aria-current": '[aria-current="true"]',
  "aria-selected": '[aria-selected="true"]',
}

export const repeat = (prefix, parts, value, suffix = "", shorthand = prefix + suffix) =>
  parts?.map(p => `${prefix}${prefix && "-"}${p}${suffix}: ${value}`).join(";\n") ?? `${shorthand}: ${value}\n`

export const edges = ch =>
  ({ t: ["top"], r: ["right"], b: ["bottom"], l: ["left"], x: ["left", "right"], y: ["top", "bottom"] }[ch])

const layers = Array.from(Array(5), () => document.head.appendChild(document.createElement("style")).sheet!)
const push = (layer, sel, body) => layers[layer].insertRule(`${sel} { ${body} }`, layers[layer].cssRules.length)
const cache = new Map<string, string>()
const classes = new Set<string>()

export const compile = (str: string) => {
  const parts = expand(str)

  for (const part of parts) {
    if (classes.has(part)) continue
    let sel = ""

    for (let [_, v, name] of part.matchAll(/(?:^|(?<=:))([\w-]+):|(\S+)/g)) {
      if (v) {
        if (!(v in variants)) break
        sel += variants[v] ?? ""
        continue
      } else sel = `.${escape(part)}${sel}`

      let layer
      if (name[0] === "!") (layer = 4), (name = name.slice(1))
      const body = cache.get(name) ?? matchShorthand(name) ?? matchRule(name) ?? ""
      if (body) push(layer ?? (body[0] === "/" ? 1 : body.includes("\n") ? 2 : 3), sel, body)
      cache.set(name, body), classes.add(part)

      if (!body) console.log("-> unknown", name)
    }
  }

  return parts
}

const matchShorthand = name =>
  shorthands[name] &&
  "/**/" +
    compile(shorthands[name])
      .map(a => cache.get(a))
      .join("; ")

const matchRule = name => {
  for (const [regex, resolve, themeFn] of rules) {
    const m = name.match(regex)
    if (m) return typeof resolve === "string" ? `${resolve}: ${themeFn ? theme[themeFn](...m.slice(1)) : m[1]}` : resolve(m)
  }
}

// Single-pass group expander
export const expand = (str, pre = "", res = [] as string[]) => {
  let a, v, s, i, len, stack

  const push = () => {
    if (!(s < i)) return // empty
    if (str[s] === "&") return res.push(pre.slice(0, -1)) // clear last "-"
    if (v++ > s) return res.push(str.slice(s, v) + pre + str.slice(v, i)) // move variant
    res.push(pre + str.slice(s, i)) // normal
  }

  for (a = v = s = i = 0, len = str.length, stack = []; i < len; i++) {
    if (str[i] === "[") a++ // ignore groups from here
    if (str[i] === "]") a-- // ignore groups until here
    if (str[i] === ":") v = i // mark `:` for variants
    if (str[i] === "(" && !a) {
      stack.push(pre) // save & compute new pre
      pre = v++ > s ? str.slice(s, v) + pre + str.slice(v, i) : pre + str.slice(s, i)
      if (str[i - 1] !== ":") pre += "-" // separator for non-variants
      s = i + 1
    }
    if (str[i] === " ") push(), (s = i + 1)
    if (str[i] === ")" && !a) push(), (s = i + 1), (pre = stack.pop())
  }
  return push(), res
}

export const escape = s => s.replace(/[\!:\.\,\[\]\*\(\)\%\"]|^\d/g, "\\$&")

// Preflight
layers[0].ownerNode!.textContent = `
*,::before,::after { box-sizing: border-box; border: 0 currentColor solid }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; overscroll-behavior: none }
body { margin: 0; line-height: inherit }
h1,h2,h3,h4,h5,h6,p,pre { margin: 0 }
p { margin: 0 0 1rem 0 }
b, strong { font-weight: bolder }
small { font-size: 80% }
a { color: inherit; text-decoration: inherit }
ol,ul { list-style: none; margin: 0; padding: 0 }
table { text-indent: 0; border-color: inherit; border-collapse: collapse }
th { text-align: left }
img,video { max-width: 100%; height: auto }

input,textarea,select { font: inherit; color: inherit; margin: 0; padding: 0 }
textarea { resize: none }
select { appearance: none }
button { appearance: button; background: none }
`

// Preact integration
export const preactHook = old => vnode => {
  if (old) old(vnode)
  if (typeof vnode.type === "string" && vnode.props?.class) vnode.__e.className = compile(vnode.props.class).join(" ")
}

// prettier-ignore
Object.defineProperty(SVGElement.prototype, "className", {
  get() { return this.getAttribute("class") },
  set(value) { this.setAttribute("class", value) },
})
