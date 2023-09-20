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
          entry.target.scrollIntoView({ behavior: "smooth", block: "end" })
        }
      },
      { root: ref.current.parentElement, threshold: [0, 1] }
    )
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [])

  // TODO: This works in safari webview but chrome only scrolls sometimes
  // data.subscribe(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "end" }))

  // TODO: it only works with 2rem, 1px is too small?
  return <div class="min-h-[2rem]" ref={ref} />
}
