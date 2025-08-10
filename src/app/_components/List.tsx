import { useAriaList } from "../_hooks"

const List = ({ class: className = "", children, ...props }) => {
  const list = useAriaList()

  return (
    <div class={`vstack outline-none border-r border-neutral-6 overflow-auto ${className}`} {...list} {...props}>
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
      class="group px-6 py-3 border-b border-neutral-6 outline-none aria-selected:bg-neutral-6 aria-selected:focus:bg-primary-10 aria-selected:focus:text-white"
      {...props}
    >
      {children}
    </div>
  )
}

const ListItemTitle = ({ children }) => <h4 class="font-semibold truncate">{children}</h4>

const ListItemSubtitle = ({ children }) => (
  <p class="truncate text-sm text-neutral-11 group-focus:text-neutral-6 group-focus:dark:text-neutral-6">{children}</p>
)

export { List }
List.Item = ListItem
ListItem.Title = ListItemTitle
ListItem.Subtitle = ListItemSubtitle
