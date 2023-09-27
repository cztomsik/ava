import { useCallback, useEffect, useRef } from "preact/hooks"

const List = ({ class: className = "", children, ...props }) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current!

    const listener = (e: KeyboardEvent) => {
      const item = el.querySelector("[role=listitem][aria-selected=true]")

      if (e.key === "ArrowDown") {
        item?.nextElementSibling?.focus()
      }

      if (e.key === "ArrowUp") {
        item?.previousElementSibling?.focus()
      }
    }

    el.addEventListener("keydown", listener)
    return () => el.removeEventListener("keydown", listener)
  }, [])

  const restoreFocus = useCallback((e: FocusEvent) => {
    ref.current?.querySelector("[role=listitem][aria-selected=true]")?.focus()
  }, [])

  return (
    <div
      ref={ref}
      role="list"
      tabIndex={0}
      class={`vstack outline-none border(r-1 neutral-6) overflow-auto ${className}`}
      onFocus={restoreFocus}
      {...props}
    >
      {children}
    </div>
  )
}

const ListItem = ({ class: className = "", children, active = false, ...props }) => {
  if (active) {
    props["aria-selected"] = true
  }

  return (
    <div
      role="listitem"
      tabIndex={-1}
      class="px-6 py-3 border(b-1 neutral-6) outline-none aria-selected:(bg-neutral-6 focus:(bg-primary-10 text-white))"
      {...props}
    >
      {children}
    </div>
  )
}

const ListItemTitle = ({ children }) => <h4 class="font-semibold">{children}</h4>

export { List }
List.Item = ListItem
ListItem.Title = ListItemTitle
