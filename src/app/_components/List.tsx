import { useAriaList } from "../_hooks"

const List = ({ class: className = "", children, ...props }) => {
  const list = useAriaList()

  return (
    <div class={`vstack outline-none border(r-1 neutral-6) overflow-auto ${className}`} {...list} {...props}>
      {children}
    </div>
  )
}

const ListItem = ({ class: className = "", children, selected = false, ...props }) => {
  if (selected) {
    props["aria-selected"] = true
    props.tabIndex = 0
  }

  return (
    <div
      role="listitem"
      tabIndex={-1}
      class="group px-6 py-3 border(b-1 neutral-6) outline-none aria-selected:(bg-neutral-6 focus:(bg-primary(10 dark:8) text-white))"
      {...props}
    >
      {children}
    </div>
  )
}

const ListItemTitle = ({ children }) => <h4 class="font-semibold truncate">{children}</h4>

const ListItemSubtitle = ({ children }) => (
  <p class="m-0 truncate text(sm neutral-11 group-focus:neutral(6 dark:11))">{children}</p>
)

export { List }
List.Item = ListItem
ListItem.Title = ListItemTitle
ListItem.Subtitle = ListItemSubtitle
