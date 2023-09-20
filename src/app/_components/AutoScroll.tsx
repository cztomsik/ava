import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"

/**
 * Automatically scrolls to the bottom of the parent element.
 */
export const AutoScroll = () => {
  const enabled = useSignal(true)
  const inView = useSignal(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const root = el.parentElement

    const handleWheel = e => {
      if (e.deltaY < 0) {
        // Disable auto-scrolling when scrolling up
        enabled.value = false
      }
    }

    const handleScrollEnd = e => {
      if (enabled.value && !inView.value) {
        // Keep scrolling to the bottom if still not in view
        el.scrollIntoView()
      }

      // Re-enable auto-scrolling if this was triggered by the user
      if (root.scrollHeight - root.scrollTop - root.clientHeight <= 200) {
        enabled.value = true
      }
    }

    const handleIntersect = ([entry]: IntersectionObserverEntry[]) => {
      inView.value = entry.isIntersecting
      if (enabled.value) {
        el.scrollIntoView()
      }
    }

    const observer = new IntersectionObserver(handleIntersect, { root, threshold: [0, 1] })
    root.addEventListener("wheel", handleWheel)
    root.addEventListener("scrollend", handleScrollEnd)
    observer.observe(ref.current)

    return () => {
      root.removeEventListener("wheel", handleWheel)
      root.removeEventListener("scrollend", handleScrollEnd)
      observer.disconnect()
    }
  }, [])

  return <div class="min-h-[1px]" ref={ref} />
}
