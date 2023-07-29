import { exec, useRouter } from "preact-router"
import { history } from "../App"

export const Link = props => {
  const [router] = useRouter()

  if (exec(props.href, router.path ? router.url : history.location.pathname, {})) {
    props = { ...props, class: (props.class || "") + " active" }
  }

  return <a {...props} />
}
