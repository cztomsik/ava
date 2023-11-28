import { options } from "preact"
import { tw, install, css, TwindUserConfig } from "@twind/core"
import presetTailwind, { TailwindTheme } from "@twind/preset-tailwind/base"
import * as radix from "@twind/preset-radix-ui/colors"
import darkColor from "@twind/preset-radix-ui/darkColor"

const colors = {
  ...radix,
  primary: radix.blue,
  primaryDark: radix.blueDark,
  warning: radix.yellow,
  warningDark: radix.yellowDark,
  neutral: radix.sand,
  neutralDark: radix.slateDark,
}

const autoprefix = ({ stringify }) => ({
  stringify: (prop, value, ctx) => {
    const prefix = CSS.supports(`${prop}: unset`) ? "" : "-webkit-"
    return prefix + stringify(prop, value, ctx)
  },
})

const globals = () => ({
  preflight: css`
    input:not([type="checkbox"]),
    select,
    textarea,
    .form-control {
      @apply inline-block appearance-none text(ellipsis neutral-12) px-2 py-[5px] bg-neutral-1 border(1 neutral-8) rounded-md resize-none;
    }

    :focus {
      @apply !border-transparent outline(& [3px] primary-7);
    }

    th {
      text-align: left;
    }
  `,
})

const macos = () => ({
  preflight:
    "webkit" in window
      ? css`
          html.oof #app {
            opacity: 0.7;
            filter: grayscale(0.85) contrast(0.9);
          }

          *:not([draggable]),
          a,
          button {
            cursor: default;
            user-select: none;
            user-drag: none;
          }

          a,
          button {
            white-space: nowrap;
          }
        `
      : "",
})

const cfg: TwindUserConfig<TailwindTheme> = {
  presets: [autoprefix, presetTailwind({ colors }), globals, macos],
  darkColor,
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

options.vnode = vnode => {
  if ("class" in vnode.props) vnode.props.class = tw(vnode.props.class as any)
}

addEventListener("blur", () => document.documentElement.classList.add("oof"))
addEventListener("focus", () => document.documentElement.classList.remove("oof"))
