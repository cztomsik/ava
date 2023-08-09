import { css } from "goober"

const styles = css`
  background: color-mix(in srgb, var(--bs-body-bg) 90%, transparent);
  backdrop-filter: blur(5px);
`

/**
 * Simple wrapper for Bootstrap modals.
 */
export const Modal = ({ title, children, onClose }) => (
  <div class={`modal d-block ${styles}`}>
    <div class="modal-dialog">
      <div class="modal-content shadow">
        <div class="modal-header">
          <h5 class="modal-title">{title}</h5>
          <button type="button" class="btn-close" onClick={onClose}></button>
        </div>
        <div class="modal-body">{children}</div>
      </div>
    </div>
  </div>
)
