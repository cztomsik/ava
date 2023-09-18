import { signal } from "@preact/signals"
import { useCallback, useEffect } from "preact/hooks"

/**
 * Simple modal component
 */
export const Modal = ({ title, class: className = "", children, onClose }) => {
  useEffect(() => {
    const prevActive = document.activeElement instanceof HTMLElement ? document.activeElement : null
    prevActive?.blur()
    count.value++

    return () => {
      count.value--
      prevActive?.focus()
    }
  }, [])

  const preventDrag = useCallback(e => e.stopPropagation(), [])

  return (
    <div tabIndex={-1} aria-hidden="true" class="fixed inset-0 z-50 flex" data-drag-window>
      <div class="w-full flex items-start justify-center pointer-events-none p-10">
        <div class={`rounded-lg bg-neutral-1 text-neutral-12 shadow-lg pointer-events-auto ${className}`}>
          <div class="hstack px-5 pt-5">
            <h5 class="text-lg font-medium">{title}</h5>
            <button type="button" class="ml-auto" onClick={onClose}>
              {cross}
            </button>
          </div>
          <div class="p-5" onMouseDown={preventDrag}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

const cross = (
  <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="14" x2="14" y2="2" stroke-width="1" stroke="#000" />
    <line x1="2" y1="2" x2="14" y2="14" stroke-width="1" stroke="#000" />
  </svg>
)

const count = signal(0)

/**
 * Animated backdrop with blur, this is just a visual effect, it doesn't prevent clicks or anything
 */
export const ModalBackdrop = () => {
  const show = count.value > 0
  return (
    <div
      class={`fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm transition-opacity ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    ></div>
  )
}
