// Smallest? Tailwind-like CSS-in-JS library for Preact
// Copyright (C) 2023 Kamil Tomšík - All Rights Reserved

import { options } from "preact"

// prettier-ignore
export const colors = {
  gray: [ "#fcfcfc", "#f9f9f9", "#f0f0f0", "#e8e8e8", "#e0e0e0", "#d9d9d9", "#cecece", "#bbbbbb", "#8d8d8d", "#838383", "#646464", "#202020" ],
  blue: [ "#fbfdff", "#f4faff", "#e6f4fe", "#d5efff", "#c2e5ff", "#acd8fc", "#8ec8f6", "#5eb1ef", "#0090ff", "#0588f0", "#0d74ce", "#113264" ],
  sky: [ "#f9feff", "#f1fafd", "#e1f6fd", "#d1f0fa", "#bee7f5", "#a9daed", "#8dcae3", "#60b3d7", "#7ce2fe", "#74daf8", "#00749e", "#1d3e56" ],
  yellow: [ "#fdfdf9", "#fefce9", "#fffab8", "#fff394", "#ffe770", "#f3d768", "#e4c767", "#d5ae39", "#ffe629", "#ffdc00", "#9e6c00", "#473b1f" ],
  get neutral() { return this.gray },
  get primary() { return this.blue },
  get warning() { return this.yellow },
}

export const theme = {
  color: (k, v) => colors[k]?.[v] ?? k,
  space: (v, p = "w") => ({ auto: "auto", px: "1px", full: "100%", screen: `100v${p}` }[v] ?? `${v * 0.25}rem`),
  fontSize: v => ({ xs: "12px", sm: "13px", base: "14px", lg: "16px", xl: "18px", "2xl": "20px" }[v] ?? v),
  fontWeight: v => ({ normal: 400, medium: 500, semibold: 600, bold: 700 }[v] ?? v),
}

type Shorthand = [RegExp, string | ((match) => string)]
export const shorthands: Array<[RegExp, string | ((match) => string)]> = [
  [/^hstack$/, ([_]) => `flex flex-row items-center`],
  [/^vstack$/, ([_]) => `flex flex-col`],
]

type Rule = [RegExp, string | ((match) => string), string?]
export const rules: Rule[] = [
  [/^text-(\w+)-(\d+)$/, "color", "color"],
  [/^text-(\w{2}|\dxl)$/, "font-size", "fontSize"],
  [/^font-(.+)$/, "font-weight", "fontWeight"],
  [/^(uppercase|lowercase|capitalize|normal-case)$/, "text-transform"],
  [/^select-(.+)$/, "user-select"],
  [/^bg-(\w+)-(\d+)$/, "background-color", "color"],
  [/^(border|outline)-(\w+)-(\d+)$/, ([_, p, k, d]) => `${p}-color: ${theme.color(k, d)}`],
  [/^[pm](\w)?-([\w\.]+)$/, ([m, e, v]) => repeat(m[0] === "p" ? "padding" : "margin", edges(e), theme.space(v))],
  [/^[wh]-([\w\.]+)$/, ([m, v]) => `${m[0] === "w" ? "width" : "height"}: ${theme.space(v, m[0])}`],
  [/^(inline|block|inline-block|flex|grid|table|table-.*)$/, ([_, v]) => `display: ${v}`],
  [/^grid-(cols|rows)-(\d+)$/, ([_, p, d]) => `grid-template-${p.replace(/col/, "column")}: repeat(${d},minmax(0,1fr))`],
  [/^flex-(row|col)$/, ([_, v]) => `flex-direction: ${v.replace(/col/, "column")}`],
  [/^gap-(.+)$/, "gap", "space"],
  [/^items-(.+)$/, "align-items"],
  [/^justify-(.+)$/, "justify-content"],
  [/^self-(.+)$/, "align-self"],
  [/^(relative|absolute|fixed)$/, "position"],
  [/^(?:inset-?([xy])?|top|right|left|bottom)-(.+)$/, ([m, e = m[0], v]) => repeat("", edges(e), theme.space(v), "inset")],
  [/^(cursor|fill|opacity|(?:overflow(?:-[xy])?)|pointer-events|transition)-(.+)$/, ([_, p, v]) => `${p}: ${v}`],
  [/^\[([\w-]+):(.+)]$/, ([_, p, v]) => `${p}: ${v}`],
]

export const repeat = (prefix, parts, value, shorthand = prefix) =>
  parts?.map(p => `${prefix}${prefix && "-"}${p}: ${value}`).join("; ") ?? `${shorthand}: ${value}`

export const edges = ch =>
  ({ t: ["top"], r: ["right"], b: ["bottom"], l: ["left"], x: ["left", "right"], y: ["top", "bottom"] }[ch])

const [l1, l2] = Array.from(Array(2), () => document.head.appendChild(document.createElement("style")).sheet!)
const cache = Object.create(null)
const atoms = new Set()

export const compile = (str: string) => {
  let m
  const className = expand(str)

  outer: for (let atom of className.split(/\s+/g)) {
    if (atoms.has(atom)) continue

    for (const [regex, resolve, themeFn] of rules) {
      if ((m = atom.match(regex))) {
        // console.log(`CSS: .${escape(atom)} { ${resolve(m)} }`)
        l1.insertRule(
          `.${escape(atom)} { ${
            typeof resolve === "string" ? `${resolve}: ${themeFn ? theme[themeFn](...m.slice(1)) : m[1]}` : resolve(m)
          } }`
        )
        atoms.add(atom)
        continue outer
      }
    }

    console.log("unknown", atom)
    atoms.add(atom)
  }

  return className
}

// Expand groups and shorthands (later):
//   focus:(border text(sm blue-1)) -> focus:border focus:text-sm focus:text-blue-1
export const expand = s => {
  const expandLast = s =>
    s.replace(/([\w-]+)(:)?\(([^\(\)]+)\)/g, (_, prefix, join = "-", parts) =>
      parts
        .split(/\s+/g)
        .map(part => prefix + join + part)
        .join(" ")
    )

  for (let next; (next = expandLast(s)) !== s; s = next);
  return s
}

export const escape = s => s.replace(/[:\.\[\]]/g, "\\$&")

// Preact integration
const old = options.diffed
options.diffed = (vnode: any) => {
  if (old) old(vnode)
  if (DEV && vnode.props?.className) console.error("className is not supported, use class", vnode.type, vnode.props)
  if (typeof vnode.type === "string" && vnode.props?.class)
    vnode.__e.className = cache[vnode.props.class] ?? (cache[vnode.props.class] = compile(vnode.props.class))
}

// prettier-ignore
Object.defineProperty(SVGElement.prototype, "className", {
  get() { return this.getAttribute("class") },
  set(value) { this.setAttribute("class", value) },
})
