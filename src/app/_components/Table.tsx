import { css } from "@twind/core"

const styles = css`
  th,
  td {
    @apply p-2 border(1 neutral-7);
  }

  th {
    text-align: left;
  }

  tr:nth-child(even) {
    @apply bg-neutral-3;
  }
`

export const Table = ({ class: className = "", ...props }) => (
  <table class={`table-fixed border-collapse ${styles} ${className}`} {...props} />
)
