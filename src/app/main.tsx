import "./custom.d.ts"
import { render, options } from "preact"
import { App } from "./App"
import { theme } from "./theme"
import { createContext } from "./styles"

createContext({ theme }).install(options)
render(<App />, document.querySelector("#app")!)

// We only need this for macos because it's common to drag the window by
// clicking on the app content.
if ("webkit" in window) {
  const delegate = e => {
    if (e.target.matches("a, button, button *, input, select, textarea")) return
    if (!e.target.closest("[data-drag-window]")) return

    e.preventDefault()
    webkit.messageHandlers.event.postMessage(e.type)
  }

  addEventListener("mousedown", delegate)
  addEventListener("dblclick", delegate)
}

if (!DEV) {
  addEventListener("contextmenu", e => {
    if (!e.target!.matches("input, textarea")) e.preventDefault()
  })
}
