import { signal } from "@preact/signals"
import { useMemo, useRef } from "preact/hooks"

export type UseFormProps<T> = {
  data?: T
  onSubmit: (data: T) => void
  onChange?: (data: T) => void
}

export const useForm = <T>({ data, onSubmit, onChange }: UseFormProps<T>) => {
  // Always use latest callbacks
  const callbacks = useRef(null as any)
  callbacks.current = { onSubmit, onChange }

  // Only reset values (and FormContext.Provider) when data changes
  return useMemo(() => {
    // default is here because useMemo should keep the same reference
    const values = signal(data ?? ({} as T))
    values.subscribe(data => callbacks.current.onChange?.(data))

    const field = name => ({
      name,
      value: values.value[name],
      onChange: e => (values.value = { ...values.value, [name]: e.target.value }),
    })

    const handleSubmit = _ => callbacks.current.onSubmit(values.value)

    return { values, field, handleSubmit }
  }, [data])
}
