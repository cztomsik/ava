/**
 * Simple wrapper for Bootstrap modals.
 */
export const Modal = ({ title, class: className = "", children, onClose }) => (
  <div tabIndex={-1} aria-hidden="true" class={`fixed inset-0 p-10 flex items-start justify-center ${className}`}>
    <div class="rounded-lg bg-neutral-100 text-neutral-700 border-1 border-neutral-200 shadow-lg md:w-2/5">
      <div class="hstack px-5 pt-5">
        <h5 class="text-lg font-medium">{title}</h5>
        <button type="button" class="ml-auto" onClick={onClose}>
          X
        </button>
      </div>
      <div class="p-5">{children}</div>
    </div>
  </div>
)
