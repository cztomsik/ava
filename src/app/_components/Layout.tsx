import { css } from "goober"

export const styles = css`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "aside header"
    "aside main"
    "aside footer";

  & > aside {
    grid-area: aside;
    min-width: 200px;
  }

  & > header {
    grid-area: header;
  }

  & > main {
    grid-area: main;
  }

  &.scroll > main {
    overflow-y: auto;
  }

  & > footer {
    grid-area: footer;
  }
`

export const Layout = ({ scroll, class: className = "", ...props }) => (
  <div class={`${styles} ${scroll ? "scroll" : ""} ${className}`} {...props} />
)
