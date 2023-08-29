import "./custom.d.ts"
import "./theme"
import { render } from "preact"
import { App } from "./App"

render(<App />, document.querySelector("#app")!)
