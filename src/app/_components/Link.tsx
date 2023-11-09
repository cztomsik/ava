import { router } from "../router"

const handleClick = e => {
  if (e.currentTarget.target === "_blank") return

  if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
    e.preventDefault()
    router.navigate(e.currentTarget.href)
  }
}

/**
 * Simple wrapper around the <a> tag that prevents the default
 * click behavior and instead uses the router to navigate.
 */
export const Link = props => {
  if (props.href === "..") props.href = location.pathname.split("/").slice(0, -1).join("/")
  if (props.href.startsWith("./")) props.href = location.pathname + props.href.slice(1)
  if (props.href.match(/^http|mailto/)) props.target = "_blank"

  props.onClick = handleClick
  return <a {...props} />
}
