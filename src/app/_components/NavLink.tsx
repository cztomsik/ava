import { useRoute, Link as RouterLink } from "wouter-preact"

export const NavLink = ({ href, activeClass = "active", strict = false, ...props }) => {
  const [isActive] = useRoute(strict ? href : `${href}/:any*`)

  if (isActive) {
    props.class = (props.class ?? props.className ?? "") + " " + activeClass
  }

  return <RouterLink href={href} {...props} />
}
