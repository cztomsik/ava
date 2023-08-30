import { css } from "@twind/core"
import { Grid } from "."

// TODO: for some reason, the resulting class name contains [object Object] prefix
//       (and the top-level styles are not working - so the mb-4 is needed)
const styles = css`
  label {
    margin-top: 0.4rem;

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
