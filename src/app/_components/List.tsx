import { useCallback, useEffect, useRef } from "preact/hooks"

const List = ({ class: className = "", children, ...props }) => {
  const ref = useRef<HTMLDivElement>(null)

  // TODO: maybe we could do this globally for all aria lists?
  //       <ListBehavior /> in root component or something like that?
  useEffect(() => {
    const el = ref.current!

    const listener = (e: KeyboardEvent) => {
      const item = el.querySelector("[role=listitem][aria-selected=true]")

      if (e.key === "ArrowDown") {
        e.preventDefault()
        item?.nextElementSibling?.focus()
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
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
      class="group px-6 py-3 border(b-1 neutral-6) outline-none aria-selected:(bg-neutral-6 focus:(bg-primary-10 text-white))"
      {...props}
    >
      {children}
    </div>
  )
}

const ListItemTitle = ({ children }) => <h4 class="font-semibold truncate">{children}</h4>

const ListItemSubtitle = ({ children }) => (
  <p class="truncate text(sm neutral-11 group-focus:neutral(6 dark:6))">{children}</p>
)

export { List }
List.Item = ListItem
ListItem.Title = ListItemTitle
ListItem.Subtitle = ListItemSubtitle
