import { css } from "@twind/core"

const styles = css`
  th,
  td {
    padding: 0.5rem;
    border: 1px solid #ddd;
  }

  th {
    text-align: left;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  @media (prefers-color-scheme: dark) {
    th,
    td {
      border-color: #333;
    }

    tr:nth-child(even) {
      background-color: #444;
    }
  }
`

export const Table = ({ children, class: className = "" }) => (
  <table class={`border-collapse ${styles} ${className}`}>{children}</table>
)
