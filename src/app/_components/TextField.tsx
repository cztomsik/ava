import { useCallback } from "preact/hooks"

export const TextField = ({ name, class: className = "", ...props }) => {
  // const form = useContext(Form.Context)

  const handleChange = useCallback(event => {
    const { name, value } = event.target
    // setValues(values => ({ ...values, [name]: value }))
  }, [])

  return <input name={name} className={`form-control ${className}`} {...props} />
}
