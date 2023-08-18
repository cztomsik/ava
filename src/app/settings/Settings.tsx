import { Alert, Button, Form, FormGrid, PageContent, PageHeader, TextField } from "../_components"

export const Settings = () => {
  const handleSubmit = () => {}

  return (
    <>
      <PageHeader title="Settings"></PageHeader>
      <PageContent>
        <Alert type="warning">
          <strong>This page is under construction.</strong> <br />
          For now, the models directory is set to your downloads folder.
        </Alert>

        <Form onSubmit={handleSubmit}>
          <FormGrid class="col-lg-6">
            <label>Models directory</label>
            <TextField name="models_directory" disabled />
          </FormGrid>

          <Button submit disabled>
            Change
          </Button>
        </Form>
      </PageContent>
    </>
  )
}
