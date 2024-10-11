import { createContext, JSX } from "preact"
import { useContext, useEffect, useMemo, useRef } from "preact/hooks"
import { signal } from "@preact/signals"

export interface FormProps<T> extends Omit<JSX.HTMLAttributes<HTMLFormElement>, "data" | "onSubmit" | "onChange"> {
  data?: T
  onSubmit: (data: NoInfer<T>) => any
  onChange?: (data: NoInfer<T>) => any
}

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
      input.select()
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
      value: getIn(value, name),
      onChange: v => onChange(setIn(value, name, v)),
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
  let { value, onChange } = form.field(name)

  if (Comp === "input" || Comp === "textarea" || Comp === "select") {
    if (props.type == "number") {
      props.onInput = e => onChange(e.target.valueAsNumber)
    } else if (props.type == "checkbox") {
      props.checked = !!value
      props.onInput = e => onChange(e.target.checked)
    } else {
      props.onInput = e => onChange(e.target.value)
    }
  } else {
    props.onChange = onChange
  }

  if (value === undefined) {
    value = defaultValue
  }

  return <Comp value={value} {...props} />
}

// Shared empty object so the useMemo() below keeps the same reference
const EMPTY = {} as any

export const useForm = ({ data = EMPTY, onSubmit, onChange }) => {
  // Always use latest callbacks
  const callbacks = useRef(null as any)
  callbacks.current = { onSubmit, onChange }

  // Only reset values (and FormContext.Provider) when data changes
  return useMemo(() => {
    const values = signal(data)
    let prev = data
    values.subscribe(data => data != prev && callbacks.current.onChange?.(data))

    const field = name => ({
      name,
      value: getIn(values.value, name),
      onChange: v => (values.value = setIn(values.value, name, v)),
    })

    const handleSubmit = _ => callbacks.current.onSubmit(values.value)

    return { values, field, handleSubmit }
  }, [data])
}

const getIn = (obj, path) => path.split(".").reduce((o, k) => o?.[k], obj)

const setIn = (obj, path, value) => {
  const copy = clone(obj)
  const keys = path.split(".")
  const last = keys.pop()!
  keys.reduce((o, k) => (o[k] = o[k] ?? {}), copy)[last] = value
  return copy
}

const clone = window.structuredClone ?? (obj => JSON.parse(JSON.stringify(obj)))
