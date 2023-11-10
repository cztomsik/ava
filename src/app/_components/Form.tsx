import { createContext } from "preact"
import { useContext, useEffect, useRef } from "preact/hooks"
import { useForm } from "../_hooks"

const FormContext = createContext<ReturnType<typeof useForm>>(null as any)

export const Form = ({ onSubmit, data = null as any, ...props }) => {
  const form = useForm({ data, onSubmit })
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

  return (
    <FormContext.Provider value={form}>
      <form noValidate ref={ref} onSubmit={form.handleSubmit} {...props} />
    </FormContext.Provider>
  )
}

export const Field = ({ name, component: Comp = "input" as any, ...props }) => {
  const form = useContext(FormContext)

  return <Comp {...form.field(name)} {...props} />
}
