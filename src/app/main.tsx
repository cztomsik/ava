import "./custom.d.ts"
import React, { render } from "preact"
import { App } from "./App"

render(<App />, document.querySelector("#app")!)

const darkMode = window.matchMedia("(prefers-color-scheme: dark)")
const updateTheme = () => document.documentElement.setAttribute("data-bs-theme", darkMode.matches ? "dark" : "light")

darkMode.addEventListener("change", () => updateTheme()), updateTheme()
