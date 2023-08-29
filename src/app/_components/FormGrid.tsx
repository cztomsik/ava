import { css } from "@twind/core"
import { Grid } from "."

const styles = css`
  margin-bottom: 1rem;

  label {
    margin-top: 0.4rem;
  }
`

export const FormGrid = ({ class: className = "", ...props }) => (
  <Grid cols="auto 1fr" class={`${styles} ${className}`} {...props} />
)
