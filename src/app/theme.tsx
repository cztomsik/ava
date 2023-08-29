import { options } from "preact"
import { tw, install, css, autoDarkColor, TwindUserConfig } from "@twind/core"
import presetTailwind, { TailwindTheme } from "@twind/preset-tailwind"

const styles = css`
  overscroll-behavior: none;

  *,
  a,
  button {
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
  }

  a,
  button,
  input,
  select {
    cursor: pointer; /* TODO: this is needed for draggability, remove once we have a better solution */
    white-space: nowrap;
  }

  input:focus {
    border-color: transparent;
  }
`

const cfg: TwindUserConfig<TailwindTheme> = {
  presets: [presetTailwind()],
  darkColor: autoDarkColor,
  rules: [
    // mini-bootstrap
    ["m([es])-(\\d+|auto)", (match, _) => `m${match[1] == "s" ? "l" : "r"}-${match[2]}`],
    ["hstack", "flex flex-row items-center"],
    ["vstack", "flex flex-col"],
    ["row", "flex flex-row -mx-2"],
    ["col", { flex: "1", padding: "0 0.5rem" }],
    ["btn", "inline-flex items-center justify-center px-3 py-2 text-sm leading-none border rounded-md"],
    ["form-control", "block w-full px-2 py-1.5 border bg-neutral-50 border-neutral-300 rounded-md"],
    ["form-select", "form-control appearance-none"],
  ],
  theme: {
    fontFamily: {
      sans: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
    },

    fontSize: {
      sm: ["13px", "1.25rem"],
      base: ["14px", "1.25rem"],
      lg: ["16px", "1.5rem"],
      xl: ["18px", "1.5rem"],
      "2xl": ["24px", "1.5rem"],
    },
  },
}

install(cfg, !DEV)
document.documentElement.classList.add(styles)

options.vnode = vnode => {
  if ("class" in vnode.props) vnode.props.class = tw(vnode.props.class as any)
}
