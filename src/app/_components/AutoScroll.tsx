import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"

/**
 * Automatically scrolls to the bottom of the parent element. If the user
 * scrolls up, auto-scrolling is disabled until the user scrolls to the bottom
 * again.
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

      setTimeout(() => {
        // Re-enable auto-scrolling if this was triggered by the user
        if (root.scrollHeight - root.scrollTop - root.clientHeight <= 200) {
          enabled.value = true
        }
      }, 100)
    }

    const handleIntersect = ([entry]: IntersectionObserverEntry[]) => {
      inView.value = entry.isIntersecting
      scrollUntilInView()
    }

    // Safari does not have a scrollend event, so we need to use a timeout
    const scrollUntilInView = () => {
      if (enabled.value && !inView.value) {
        // Chrome does not like { behavior: "smooth", block: "start" }
        el.scrollIntoView()
        setTimeout(() => scrollUntilInView, 1_000)
      }
    }

    const observer = new IntersectionObserver(handleIntersect, { root, threshold: [0, 1] })
    root.addEventListener("wheel", handleWheel)
    observer.observe(ref.current)

    return () => {
      root.removeEventListener("wheel", handleWheel)
      observer.disconnect()
    }
  }, [])

  return <div class="min-h-[1px]" ref={ref} />
}
