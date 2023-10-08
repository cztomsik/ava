import { useCallback } from "preact/hooks"

export const TextField = ({ name, ...props }) => {
  // const form = useContext(Form.Context)

  const handleChange = event => {
    const { name, value } = event.target
    // setValues(values => ({ ...values, [name]: value }))
  }

  return <input name={name} {...props} />
}
