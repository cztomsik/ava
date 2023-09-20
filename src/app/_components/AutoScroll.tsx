import { useEffect, useRef } from "preact/hooks"

/**
 * Automatically scrolls to the bottom of the parent element.
 */
export const AutoScroll = () => {
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          keepScrollingUntilInView(entry.target as HTMLElement)
        }
      },
      { root: ref.current.parentElement, threshold: [0, 1] }
    )
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  return <div class="min-h-[1px]" ref={ref} />
}

const keepScrollingUntilInView = (element: HTMLElement) => {
  if (element.parentElement.scrollTop < element.offsetTop) {
    element.scrollIntoView({ behavior: "smooth", block: "end" })
    setTimeout(() => keepScrollingUntilInView(element), 100)
  }
}
