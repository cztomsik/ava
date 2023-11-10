import { Button, Form, FormGrid, Field } from "../_components"

export const ToolForm = ({ tool, onSubmit }) => {
  return (
    <Form data={tool} onSubmit={onSubmit}>
      <FormGrid>
        <label>Title</label>
        <Field name="name" />

        <label>Description</label>
        <Field name="description" />

        <label>Prompt</label>
        <Field component="textarea" rows={10} name="prompt" />

        <div />
        <div class="hstack gap-2">
          <Button submit>Save</Button>
          <Button href=".." text>
            Cancel
          </Button>
        </div>
      </FormGrid>
    </Form>
  )
}
