import { render } from "preact"
import { App } from "./App"
import "bootstrap/dist/js/bootstrap"
import "./styles.css"

render(<App />, document.querySelector("#app")!)
