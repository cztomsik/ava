import { css } from "@twind/core"

export const styles = css`
  display: grid;
  grid-template-columns: min-content min-content 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "aside list header"
    "aside list main"
    "aside list footer";

  & > * {
    grid-area: main;
  }

  & > aside {
    grid-area: aside;
  }

  & > nav {
    grid-area: list;
  }

  & > header {
    grid-area: header;
  }

  & > footer {
    grid-area: footer;
  }
`

export const Layout = ({ class: className = "", ...props }) => <div class={`${styles} ${className}`} {...props} />
