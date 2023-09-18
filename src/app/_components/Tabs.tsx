import { css } from "@twind/core"

const styles = css`
  & a {
    @apply inline-block p-4 border(b-2 transparent);
    margin-top: -2px;

    &.active {
      @apply text-blue-10 border-blue-10;
    }
  }
`

export const Tabs = ({ class: className = "", children }) => {
  return (
    <div class={`font-medium text(sm center neutral-9) ${styles} ${className}`}>
      <div class="flex flex-wrap -mb-px">{children}</div>
    </div>
  )
}
