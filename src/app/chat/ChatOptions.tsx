import { FormGroup, Field } from "../_components"

export const ChatOptions = ({ value, onChange }) => {
  return (
    <FormGroup class="p-3" value={value} onChange={onChange}>
      <h3 class="mb-2 text-neutral-10 text-sm uppercase font-medium">Chat options</h3>

      <div class="vstack gap-3">
        <Field name="user" label="User Name" />
        <Field name="assistant" label="Assistant Name" />
      </div>
    </FormGroup>
  )
}
