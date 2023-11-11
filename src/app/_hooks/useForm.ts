import { signal } from "@preact/signals"
import { useMemo } from "preact/hooks"

export type UseFormProps<T> = {
  data?: T
  onSubmit: (data: T) => void
  onChange?: (data: T) => void
}

export const useForm = <T>({ data, onSubmit, onChange }: UseFormProps<T>) =>
  useMemo(() => {
    // default is here because useMemo should keep the same reference
    const values = signal(data ?? ({} as T))
    if (onChange) values.subscribe(onChange)

    const field = name => ({
      name,
      value: values.value[name],
      onChange: e => (values.value = { ...values.value, [name]: e.target.value }),
    })

    const handleSubmit = _ => onSubmit(values.value)

    return { values, field, handleSubmit }
  }, [data])
