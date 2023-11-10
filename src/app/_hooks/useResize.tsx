import { computed } from "@preact/signals"
import { useMemo } from "preact/hooks"
import { clamp } from "../_util"
import { useLocalStorage } from "./useLocalStorage"

export const useResize = ({ sizes: [min, base, max], storageKey = null, rtl = false }) => {
  const size = useLocalStorage(storageKey, base)

  return useMemo(() => {
    const onMouseDown = (e: MouseEvent) => {
      const { pageX: startX } = e
      const startWidth = size.value

      const updater = (e: MouseEvent) =>
        (size.value = clamp(min, max, startWidth + (rtl ? startX - e.pageX : e.pageX - startX)))

      window.addEventListener("mousemove", updater)
      window.addEventListener("mouseup", () => window.removeEventListener("mousemove", updater), { once: true })

      e.preventDefault()
      e.stopPropagation()
    }

    const style = computed(() => `width: ${size.value}px`)

    return { style, onMouseDown }
  }, [])
}
