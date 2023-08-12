import { css } from "goober"

const styles = css`
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
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

  & > main {
    grid-area: main;
  }

  & > footer {
    grid-area: footer;
  }
`

export const Layout = ({ class: className = "", children }) => <div class={`${styles} ${className}`}>{children}</div>
