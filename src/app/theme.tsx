import { options } from "preact"
import { tw, install, css, autoDarkColor, TwindUserConfig } from "@twind/core"
import presetTailwind, { TailwindTheme } from "@twind/preset-tailwind"

// TODO: some of these should be webview-only
const styles = css`
  overscroll-behavior: none;

  &.oof #app {
    opacity: 0.7;
    filter: grayscale(0.85) contrast(0.85);
  }

  *,
  a,
  button {
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    -webkit-user-drag: none;
  }

  a,
  button {
    white-space: nowrap;
  }

  input,
  select,
  textarea {
    @apply inline-block appearance-none outline-none text(ellipsis neutral-700) px-2 py-1.5 bg-neutral-50 border(1 neutral-300 focus:transparent) focus:ring(& blue-500) rounded-md resize-none;
  }
`

const autoprefix = ({ stringify }) => ({
  stringify: (prop, value, ctx) => {
    const prefix = CSS.supports(`${prop}: unset`) ? "" : "-webkit-"
    return prefix + stringify(prop, value, ctx)
  },
})

const cfg: TwindUserConfig<TailwindTheme> = {
  presets: [presetTailwind(), autoprefix],
  darkColor: autoDarkColor,
  rules: [
    // mini-bootstrap
    ["hstack", "flex(& row) items-center"],
    ["vstack", "flex(& col)"],
    ["row", "flex(& row) -mx-2"],
    ["col", { flex: "1", padding: "0 0.5rem" }],

    // custom
    ["shadow-thin", { boxShadow: "0 1px 1px 0 rgba(0, 0, 0, 0.3)" }],
  ],
  variants: [
    // out-of-focus (TODO: maybe opacity is enough?)
    // or maybe just define few color classes and override them in dark mode
    // ["oof", "&:is(.oof *)"],
  ],
  theme: {
    fontFamily: {
      sans: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
    },

    fontSize: {
      xs: ["12px", "1rem"],
      sm: ["13px", "1rem"],
      base: ["14px", "1.25rem"],
      lg: ["16px", "1.5rem"],
      xl: ["18px", "1.5rem"],
      "2xl": ["20px", "1.5rem"],
    },
  },
}

install(cfg, !DEV)
document.documentElement.classList.add(styles)

options.vnode = vnode => {
  if ("class" in vnode.props) vnode.props.class = tw(vnode.props.class as any)
}

addEventListener("blur", () => document.documentElement.classList.add("oof"))
addEventListener("focus", () => document.documentElement.classList.remove("oof"))
