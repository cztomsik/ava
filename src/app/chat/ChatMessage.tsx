import { css } from "@twind/core"
import { Markdown } from "../_components"

const styles = css`
  &.role-system {
    color: var(--bs-secondary);
  }

  &.role-user {
    border-left: 4px solid var(--bs-primary);
    padding-left: 1rem;
    margin-left: -1rem;

    .role {
      color: var(--bs-primary);
    }
  }
`
export const ChatMessage = ({ role, content }) => (
  <div class={`group ${role} ${styles} mb-4`}>
    <div class="capitalize font-semibold group-[.system]:hidden">{role}:</div>
    <div class="content">
      <Markdown input={"" + content} />
    </div>
  </div>
)
