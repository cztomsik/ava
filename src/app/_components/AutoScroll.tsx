import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"

/**
 * Automatically scrolls to the bottom of the parent element. If the user
 * scrolls up, auto-scrolling is disabled until the user scrolls to the bottom
 * again.
 */
export const AutoScroll = () => {
  const enabled = useSignal(true)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current!
    const container = el.parentElement!

    const handleWheel = e => {
      if (e.deltaY < 0) {
        // Disable auto-scrolling when scrolling up
        enabled.value = false
      }

      setTimeout(() => {
        // Re-enable auto-scrolling if this was triggered by the user
        if (container.scrollHeight - container.scrollTop - container.clientHeight <= 200) {
          enabled.value = true
        }
      }, 100)
    }

    const scrollToBottom = () => {
      if (enabled.value) {
        // Chrome does not like { behavior: "smooth", block: "start" }
        el.scrollIntoView()
      }
    }

    const observer = new MutationObserver(scrollToBottom)
    observer.observe(container, { characterData: true, childList: true, subtree: true })
    container.addEventListener("wheel", handleWheel, { passive: true })

    // Initial scroll
    scrollToBottom()

    return () => {
      container.removeEventListener("wheel", handleWheel)
      observer.disconnect()
    }
  }, [])

  return <div class="min-h-[1px]" ref={ref} />
}
