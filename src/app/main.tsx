import "./custom.d.ts"
import { render } from "preact"
import { App } from "./App"

render(<App />, document.querySelector("#app")!)

// Quickfix for macos (should be DEV-only but we need to check)
addEventListener("keypress", e => {
  if (e.metaKey) {
    if (e.key === "c") document.execCommand("copy")
    else if (e.key === "v") document.execCommand("paste")
    else if (e.key === "Z") document.execCommand("redo")
    else if (e.key === "z") document.execCommand("undo")
    else return
    e.preventDefault()
  }
})

if (!DEV) {
  addEventListener("contextmenu", e => {
    if (!e.target!.matches("input, textarea")) e.preventDefault()
  })
}
