import { Button, Form, FormGrid, TextArea, TextField } from "../_components"

export const ToolForm = ({ tool, onSubmit }) => {
  return (
    <Form data={tool} onSubmit={onSubmit}>
      <FormGrid>
        <label>Title</label>
        <TextField name="name" />

        <label>Description</label>
        <TextField name="description" />

        <label>Prompt</label>
        <TextArea rows={10} name="prompt" />

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
