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

/**
 * A wrapper around the Link component that adds an active class to the
 * link when the route is active.
 **/
export const NavLink = ({ href, class: className = "", activeClass = "active", exact = false, ...props }) => {
  // Touch the currentRoute to subscribe to changes
  router.currentRoute

  const active = router.match(exact ? href : `${href}*`)

  return <Link class={`${className} ${active ? activeClass : ""}`} href={href} {...props} />
}
