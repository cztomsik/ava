import { useCallback, useEffect, useRef } from "preact/hooks"

export const Form = ({ onSubmit, ...props }) => {
  const ref = useRef(null)

  // Focus the first element with autofocus or the first input
  // TODO: maybe <select> should be here too but it doesn't feel right
  useEffect(() => {
    const input = ref.current?.querySelector("[autofocus]") ?? ref.current?.querySelector("input, textarea")
    input?.focus()
  }, [])

  const handleSubmit = useCallback(event => {
    event.preventDefault()
    onSubmit()
  }, [])

  return <form noValidate ref={ref} onSubmit={handleSubmit} {...props} />
}
