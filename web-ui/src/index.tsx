import { createElement as h, render } from "preact/compat"
import { App } from "./App"
import "bootstrap/dist/js/bootstrap"

render(<App />, document.querySelector("#app"))
