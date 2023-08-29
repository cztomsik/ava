import { css } from "@twind/core"
import { Markdown } from "../_components"

const styles = css`
  .role {
    text-transform: capitalize;
    font-weight: 600;
  }

  &.role-system {
    color: var(--bs-secondary);

    .role {
      display: none;
    }
  }

  &.role-user {
    border-left: 4px solid var(--bs-primary);
    padding-left: 1rem;
    margin-left: -1rem;

    .role {
      color: var(--bs-primary);
    }
  }

  pre {
    background: var(--bs-neutral-200);
    padding: 1rem;
    border: 1px solid var(--bs-border-color);
  }
`
export const ChatMessage = ({ role, content }) => (
  <div class={`${styles} mb-4 role-${role}`}>
    <div class="role">{role}:</div>
    <div class="content">
      <Markdown input={"" + content} />
    </div>
  </div>
)
