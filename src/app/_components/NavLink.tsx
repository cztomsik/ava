import { Link } from "."
import { router } from "../router"

/**
 * A wrapper around the Link component that adds an active class to the
 * link when the route is active.
 **/
export const NavLink = ({ href, activeClass = "active", strict = false, ...props }) => {
  if (router.match(`${href}*`)) {
    props.class = (props.class ?? props.className ?? "") + " " + activeClass
  }

  return <Link href={href} {...props} />
}
