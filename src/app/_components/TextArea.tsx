import { useContext } from "preact/hooks"
import { Form } from "./Form"

export const TextArea = ({ name, ...props }) => {
  const form = useContext(Form.Context)

  return <textarea {...form.field(name)} {...props} />
}
