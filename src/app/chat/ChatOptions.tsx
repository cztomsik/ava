import { Form, Field } from "../_components"

export const ChatOptions = ({ data, onChange }) => {
  return (
    <Form class="p-3" data={data} onChange={onChange} onSubmit={onChange}>
      <h3 class="mb-2 text-neutral-10 text-sm uppercase font-medium">Chat options</h3>

      <div class="vstack gap-3">
        <Field name="user" label="User Name" />
        <Field name="assistant" label="Assistant Name" />
      </div>
    </Form>
  )
}
