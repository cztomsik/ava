import { css } from "@twind/core"

export const styles = css`
  display: grid;
  grid-template-columns: min-content 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "aside header"
    "aside main"
    "aside footer";

  & > aside {
    grid-area: aside;
  }

  & > header {
    grid-area: header;
  }

  & > footer {
    grid-area: footer;
  }

  & > :not(aside, header, footer) {
    grid-area: main;
  }
`

export const Layout = ({ class: className = "", ...props }) => <div class={`${styles} ${className}`} {...props} />
