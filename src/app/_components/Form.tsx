import { useEffect, useRef } from "preact/hooks"

export const Form = ({ onSubmit, ...props }) => {
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const form = ref.current!

    // prevent default form submission
    form.addEventListener("submit", e => e.preventDefault())

    // Focus the first element with autofocus or the first input
    // TODO: maybe <select> should be here too but it doesn't feel right
    const input: HTMLElement | null = form.querySelector("[autofocus]") ?? form.querySelector("input, textarea")
    input?.focus()
  }, [])

  return <form noValidate ref={ref} onSubmit={onSubmit} {...props} />
}
