// Smallest? Tailwind-like CSS-in-JS library for Preact
// Copyright (C) 2023 Kamil Tomšík - All Rights Reserved

import { options } from "preact"

// prettier-ignore
export const colors = {
  neutral: [ "#fcfcfc", "#f9f9f9", "#f0f0f0", "#e8e8e8", "#e0e0e0", "#d9d9d9", "#cecece", "#bbbbbb", "#8d8d8d", "#838383", "#646464", "#202020" ],
  blue: [ "#fbfdff", "#f4faff", "#e6f4fe", "#d5efff", "#c2e5ff", "#acd8fc", "#8ec8f6", "#5eb1ef", "#0090ff", "#0588f0", "#0d74ce", "#113264" ],
  sky: [ "#f9feff", "#f1fafd", "#e1f6fd", "#d1f0fa", "#bee7f5", "#a9daed", "#8dcae3", "#60b3d7", "#7ce2fe", "#74daf8", "#00749e", "#1d3e56" ],
  get primary() { return this.blue },
}

export const theme = {
  color: (k, v) => colors[k]?.[v] ?? k,
  space: (v, p = "w") => ({ auto: "auto", px: "1px", full: "100%", screen: `100v${p}` }[v] ?? `${v * 0.25}rem`),
  fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
}

export const shorthands: Array<[RegExp, (match) => string]> = [
  [/^hstack$/, ([_]) => `flex flex-row items-center`],
  [/^vstack$/, ([_]) => `flex flex-col`],
]

export const rules: Array<[RegExp, (match) => string]> = [
  [/^text-(\w+)-(\d+)$/, ([_, k, d]) => `color: ${theme.color(k, d)}`],
  [/^font-(.+)$/, ([_, v]) => `font-weight: ${theme.fontWeight[v]}`],
  [/^(uppercase|lowercase|capitalize|normal-case)$/, ([_, v]) => `text-transform: ${v}`],
  [/^select-(.+)$/, ([_, v]) => `user-select: ${v}`],
  [/^bg-(\w+)-(\d+)$/, ([_, k, d]) => `background-color: ${theme.color(k, d)}`],
  [/^(border|outline)-(\w+)-(\d+)$/, ([_, p, k, d]) => `${p}-color: ${theme.color(k, d)}`],
  [/^[pm](\w)?-([\w\.]+)$/, ([m, e, v]) => repeat(m[0] === "p" ? "padding" : "margin", edges(e), theme.space(v))],
  [/^[wh]-([\w\.]+)$/, ([m, v]) => `${m[0] === "w" ? "width" : "height"}: ${theme.space(v, m[0])}`],
  [/^(inline|block|inline-block|flex|grid|table|table-.*)$/, ([_, v]) => `display: ${v}`],
  [/^grid-(cols|rows)-(\d+)$/, ([_, p, d]) => `grid-template-${p.replace(/col/, "column")}: repeat(${d},minmax(0,1fr))`],
  [/^flex-(row|col)$/, ([_, v]) => `flex-direction: ${v.replace(/col/, "column")}`],
  [/^gap-(.+)$/, ([_, v]) => `gap: ${theme.space(v)}`],
  [/^items-(.+)$/, ([_, v]) => `align-items: ${v}`],
  [/^justify-(.+)$/, ([_, v]) => `justify-content: ${v}`],
  [/^self-(.+)$/, ([_, v]) => `align-self: ${v}`],
  [/^(relative|absolute|fixed)$/, ([_, v]) => `position: ${v}`],
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
  const className = expand(str)

  outer: for (let atom of className.split(/\s+/g)) {
    if (atoms.has(atom)) continue

    for (const [regex, resolve] of rules) {
      const m = atom.match(regex)
      if (m) {
        // console.log(`CSS: .${escape(atom)} { ${resolve(m)} }`)
        l1.insertRule(`.${escape(atom)} { ${resolve(m)} }`)
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
  if (typeof vnode.type === "string" && vnode.props?.class)
    vnode.__e.className = cache[vnode.props.class] ?? (cache[vnode.props.class] = compile(vnode.props.class))
}

// prettier-ignore
Object.defineProperty(SVGElement.prototype, "className", {
  get() { return this.getAttribute("class") },
  set(value) { this.setAttribute("class", value) },
})
