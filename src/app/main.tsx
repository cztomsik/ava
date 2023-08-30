import "./custom.d.ts"
import "./theme"
import { render } from "preact"
import { App } from "./App"

render(<App />, document.querySelector("#app")!)

// We only need this for macos because it's common to drag the window by
// clicking on the app content.
if ("webkit" in window) {
  addEventListener("mousedown", e => {
    if (e.target.matches("a, button, input, select, textarea")) return
    if (!e.target.closest("[data-drag-window]")) return

    webkit.messageHandlers.event.postMessage("drag")
  })
}
