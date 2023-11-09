import { signal } from "@preact/signals"
import { useMemo } from "preact/hooks"

export const useForm = ({ data, onSubmit }) =>
  useMemo(() => {
    const values = signal(data)

    const field = name => ({
      name,
      value: values.value[name],
      onChange: e => (values.value = { ...values.value, [name]: e.target.value }),
    })

    const handleSubmit = _ => onSubmit(values.value)

    return { values, field, handleSubmit }
  }, [data])
