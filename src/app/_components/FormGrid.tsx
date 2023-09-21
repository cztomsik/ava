import { css } from "@twind/core"
import { Grid } from "./Grid"

// align-self would work too but it wouldn't add margin when the label is on top
const styles = css`
  & label {
    @apply mt-1.5;

    @media (min-width: 768px) {
      min-width: 6rem;
      text-align: right;
    }

    @media (min-width: 1024) {
      min-width: 10rem;
    }
  }
`

export const FormGrid = ({ class: className = "", ...props }) => (
  <Grid cols="auto 1fr" class={`mb-4 ${styles} ${className}`} {...props} />
)
