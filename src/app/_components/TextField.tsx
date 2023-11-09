import { useContext } from "preact/hooks"
import { Form } from "./Form"

export const TextField = ({ name, ...props }) => {
  const form = useContext(Form.Context)

  return <input {...form.field(name)} {...props} />
}
