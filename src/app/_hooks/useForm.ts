import { signal } from "@preact/signals"
import { useMemo, useRef } from "preact/hooks"

export type UseFormProps<T> = {
  data?: T
  onSubmit: (data: T) => void
  onChange?: (data: T) => void
}

// Shared empty object so the useMemo() below keeps the same reference
const EMPTY = {} as any

export const useForm = <T>({ data = EMPTY, onSubmit, onChange }: UseFormProps<T>) => {
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
      value: values.value[name],
      onChange: e => (values.value = { ...values.value, [name]: e instanceof Event ? e.target!.value : e }),
    })

    const handleSubmit = _ => callbacks.current.onSubmit(values.value)

    return { values, field, handleSubmit }
  }, [data])
}
