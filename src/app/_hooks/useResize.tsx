import { computed } from "@preact/signals"
import { useMemo } from "preact/hooks"
import { clamp } from "../_util"

export const useResize = ({ width, position = "right", minWidth = 0, maxWidth = Number.MAX_SAFE_INTEGER }) =>
  useMemo(() => {
    const onMouseDown = (e: MouseEvent) => {
      const { pageX: startX } = e
      const startWidth = width?.value

      const updater = (e: MouseEvent) =>
        (width.value = clamp(minWidth, maxWidth, startWidth + (position === "right" ? e.pageX - startX : startX - e.pageX)))

      window.addEventListener("mousemove", updater)
      window.addEventListener("mouseup", () => window.removeEventListener("mousemove", updater), { once: true })

      e.preventDefault()
      e.stopPropagation()
    }

    const style = computed(() => `width: ${width.value}px`)

    const resizeHandle = <div class={`absolute ${position}-0 inset-y-0 w-2 cursor-col-resize`} onMouseDown={onMouseDown} />

    return { style, resizeHandle, onMouseDown }
  }, [width])
