import { computed } from "@preact/signals"
import { useMemo } from "preact/hooks"

export const useResize = ({ width, minWidth = 0, maxWidth = Number.MAX_SAFE_INTEGER }) =>
  useMemo(() => {
    const onMouseDown = (e: MouseEvent) => {
      const { pageX: startX } = e
      const startWidth = width?.value

      const updater = (e: MouseEvent) =>
        (width.value = Math.max(minWidth, Math.min(maxWidth, startWidth + e.pageX - startX)))

      window.addEventListener("mousemove", updater)
      window.addEventListener("mouseup", () => window.removeEventListener("mousemove", updater), { once: true })

      e.preventDefault()
      e.stopPropagation()
    }

    const style = computed(() => `width: ${width.value}px`)

    const resizeHandle = <div class="absolute right-0 inset-y-0 w-2 cursor-col-resize" onMouseDown={onMouseDown} />

    return { style, resizeHandle, onMouseDown }
  }, [width, minWidth])
