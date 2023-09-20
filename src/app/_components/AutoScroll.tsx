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
    console.log("mounted")

    const root = ref.current.parentElement

    const handleScroll = () => {
      // enabled.value = root.scrollTop + root.clientHeight >= root.scrollHeight - 10
    }

    const handleIntersect = ([entry]: IntersectionObserverEntry[]) => {
      inView.value = entry.isIntersecting
      keepScrollingUntilInView(entry.target as HTMLElement)
    }

    const keepScrollingUntilInView = (element: HTMLElement) => {
      if (!inView.value) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
        setTimeout(() => keepScrollingUntilInView(element), 1_000)
      }
    }

    const observer = new IntersectionObserver(handleIntersect, { root, threshold: [0, 1] })
    root.addEventListener("scroll", handleScroll)
    observer.observe(ref.current)

    return () => {
      root.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [])

  return <div class="min-h-[1px]" ref={ref} />
}
