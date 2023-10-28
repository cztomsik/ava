import { css } from "@twind/core"

export const AutoGrowTextarea = ({ class: className = "", ...props }) => (
  <div class="vstack relative">
    <textarea class={`!absolute !inset-0 ${className}`} {...props} />
    <div class={`form-control ${className} ${autoGrow}`} data-value={props.value} />
  </div>
)

// this will render text value into an invisible pseudo element, which will
// then be used to calculate the height of the textarea
const autoGrow = css`
  visibility: hidden;
  white-space: pre-wrap;
  max-height: 30vh;
  overflow-y: hidden;

  &:after {
    content: attr(data-value) " ";
  }
`
