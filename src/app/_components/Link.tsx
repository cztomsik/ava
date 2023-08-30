import { router } from "../router"

const handleClick = e => {
  if (!(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
    e.preventDefault()
    router.navigate(e.target.href)
  }
}

/**
 * Simple wrapper around the <a> tag that prevents the default
 * click behavior and instead uses the router to navigate.
 */
export const Link = props => {
  props.onClick = handleClick
  return <a {...props} />
}
