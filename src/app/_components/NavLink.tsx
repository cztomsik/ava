import { Link } from "."

/**
 * A wrapper around the Link component that adds an active class to the
 * link when the route is active.
 **/
export const NavLink = ({ href, activeClass = "active", strict = false, ...props }) => {
  // const [isActive] = useRoute(strict ? href : `${href}/:any*`)

  // if (isActive) {
  //   props.class = (props.class ?? props.className ?? "") + " " + activeClass
  // }

  return <Link href={href} {...props} />
}
