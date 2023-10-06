import { useRef, useEffect } from "preact/hooks"

/**
 * Container for a button and a dropdown menu.
 * Show/hides the dropdown menu when clicked.
 */
export const Dropdown = ({ class: className = "", ...props }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = ({ target }) => {
      const el = ref.current!
      el.querySelector(".dropdown-menu")?.classList.toggle(
        "show",
        el.contains(target) && !target.matches(".dropdown-menu :is(a, button)")
      )
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return <div ref={ref} class={`dropdown ${className}`} {...props} />
}
