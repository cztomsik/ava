import { Button, Form, FormGrid, TextField } from "../_components"

export const ToolForm = ({ tool, onSubmit }) => {
  return (
    <Form onSubmit={onSubmit}>
      <FormGrid>
        <label>Title</label>
        <TextField name="title" />

        <label>Description</label>
        <TextField name="description" />

        <label>Prompt</label>
        <TextField name="prompt" />

        <div />
        <div class="hstack gap-2">
          <Button submit>Save</Button>
          <Button href="..">Cancel</Button>
        </div>
      </FormGrid>
    </Form>
  )
}
