import { css } from "@twind/core"

/**
 * Simple wrapper for Bootstrap modals.
 */
export const Modal = ({ title, class: className = "", children, onClose }) => (
  <div class={`fixed top-0 left-0 right-0 bottom-0 p-10 flex items-start justify-center ${className}`}>
    <div class="rounded border-1 border-neutral-500 shadow-lg w-1/2">
      <div class="hstack p-4">
        <h5 class="text-lg font-medium">{title}</h5>
        <button type="button" class="ms-auto" onClick={onClose}>
          X
        </button>
      </div>
      <div class="p-4">{children}</div>
    </div>
  </div>
)
