import { css } from "@twind/core"

const styles = css`
  & a {
    @apply inline-block p-4 border(b-2 transparent);
    margin-top: -2px;

    &.active {
      @apply text-blue(600 dark:500) border-blue(600 dark:500);
    }
  }
`

export const Tabs = ({ class: className = "", children }) => {
  return (
    <div class={`font-medium text(sm center gray-500 dark:gray-400) ${styles} ${className}`}>
      <div class="flex flex-wrap -mb-px">{children}</div>
    </div>
  )
}
