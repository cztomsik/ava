import { css } from "@twind/core"

const cache = {}

export const Grid = ({ cols, class: className = "", ...props }) => {
  const styles =
    cache[cols] ??
    (cache[cols] = css`
      display: grid;
      grid-template-columns: ${cols};
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        row-gap: 0.5rem;
      }
    `)

  return <div class={`${styles} ${className}`} {...props} />
}