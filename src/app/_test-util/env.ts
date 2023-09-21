import "undom/register.js"
import { render as preactRender } from "preact"

export const render = vdom => {
  const root = document.createElement("div")
  preactRender(vdom, root)
  return root.childNodes.length === 1 ? root.childNodes[0] : root.childNodes
}

export const serialize = node => {
  if (node instanceof Array) {
    return node.map(n => serialize(n)).join("")
  }

  switch (node.nodeType) {
    case 3:
      return escape(node.textContent)

    case 1: {
      const el = node
      const tag = el.nodeName.toLowerCase()
      const attrs = el.attributes.map(att => ` ${att.name}="${escape(att.value)}"`).join("")
      const childNodes = el.childNodes.map(n => serialize(n)).join("")

      return `<${tag}${attrs}>${childNodes}</${tag}>`
    }
  }
}

const escape = str => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
