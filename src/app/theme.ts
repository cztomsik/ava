import { baseTheme } from "./styles"

export const theme = {
  ...baseTheme,

  colors: {
    ...baseTheme.colors,
    neutral: baseTheme.colors.gray,
    primary: baseTheme.colors.blue,
    warning: baseTheme.colors.yellow,
  },

  darkColors: {
    ...baseTheme.darkColors,
    neutral: baseTheme.darkColors.gray,
    primary: baseTheme.darkColors.blue,
    warning: baseTheme.darkColors.yellow,
  },
}
