import { useRoute, Link as RouterLink } from "wouter-preact"

/**
 * A wrapper around the RouterLink component that adds an active class to the
 * link when the route is active.
 **/
export const NavLink = ({ href, activeClass = "active", strict = false, ...props }) => {
  const [isActive] = useRoute(strict ? href : `${href}/:any*`)

  if (isActive) {
    props.class = (props.class ?? props.className ?? "") + " " + activeClass
  }

  return <RouterLink href={href} {...props} />
}
