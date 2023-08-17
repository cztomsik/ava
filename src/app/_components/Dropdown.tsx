import { useRef, useEffect } from "preact/hooks"

export const Dropdown = ({ component = "div", class: className = "", ...props }) => {
  const Component = component as any

  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const el = ref.current
      el?.querySelector(".dropdown-menu").classList.toggle("show", el.contains(event.target))
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return <Component ref={ref} class={`dropdown ${className}`} {...props} />
}
