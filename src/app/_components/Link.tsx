import { exec, useRouter } from "preact-router"

export const Link = props => {
  const [router] = useRouter()

  if (exec(props.href, router.path ? router.url : location.pathname, {})) {
    props = { ...props, class: (props.class || "") + " active" }
  }

  return <a {...props} />
}
