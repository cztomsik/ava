import { createContext, JSX } from "preact"
import { useContext, useEffect, useMemo, useRef } from "preact/hooks"
import { useForm, UseFormProps } from "../_hooks"

export type FormProps<T> = UseFormProps<T> & Omit<JSX.HTMLAttributes<HTMLFormElement>, "data" | "onSubmit">

const FormContext = createContext<ReturnType<typeof useForm>>(null as any)

export const Form = <T extends {}>({ onSubmit, onChange, data, ...props }: FormProps<T>) => {
  const form = useForm({ data, onSubmit, onChange })
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const form = ref.current!

    // prevent default form submission
    form.addEventListener("submit", e => e.preventDefault())

    // Focus the first element with autofocus or the first input
    // TODO: maybe <select> should be here too but it doesn't feel right
    const input: HTMLElement | null = form.querySelector("[autofocus]") ?? form.querySelector("input, textarea")
    input?.focus()

    if (input instanceof HTMLInputElement) {
      input.setSelectionRange(0, input.value.length)
    }
  }, [])

  return (
    <FormContext.Provider value={form}>
      <form noValidate ref={ref} onSubmit={form.handleSubmit} {...props} />
    </FormContext.Provider>
  )
}

export const FormGroup = ({ value, onChange, ...props }) => {
  const form = useContext(FormContext)
  const group = useMemo(() => {
    const field = name => ({
      name,
      value: value[name],
      onChange: e => onChange({ ...value, [name]: e instanceof Event ? e.target!.value : e }),
    })

    return { ...form, field }
  }, [form, value, onChange])

  return (
    <FormContext.Provider value={group}>
      <div {...props} />
    </FormContext.Provider>
  )
}

export const FormGrid = ({ class: className = "", ...props }) => (
  // align-self wouldn't add margin when the label is on top
  <div class={`grid grid-cols-[auto_1fr] gap-4 mb-4 [&_label]:(mt-1.5 md:text-right) ${className}`} {...props} />
)

export const Field = ({ name, as: Comp = "input" as any, defaultValue = undefined as any, ...props }) => {
  const form = useContext(FormContext)
  const field = form.field(name)

  if (Comp === "input" || Comp === "textarea") {
    props.onInput = field.onChange
  }

  if (field.value === undefined) {
    field.value = defaultValue
  }

  return <Comp {...field} {...props} />
}
