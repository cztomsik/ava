import { Alert, Button, Form, FormGrid, PageContent, PageHeader, TextField } from "../_components"

export const Settings = () => {
  const handleSubmit = () => {}

  return (
    <>
      <PageHeader title="Settings"></PageHeader>
      <PageContent>
        <Alert class="bg-orange-50 my-4">
          <strong>This page is under construction.</strong> <br />
          For now, the models directory is set to your downloads folder.
        </Alert>

        {/* <Form onSubmit={handleSubmit}>
          <FormGrid class="col-lg-6">
            <label>Models directory</label>
            <TextField name="models_directory" disabled />
          </FormGrid>

          <Button submit disabled>
            Change
          </Button>
        </Form>

        <div class="my-4">
          <h3 class="text-lg font-semibold border-b-1">About</h3>
          <p class="text-sm text-gray-500"></p>

          <div class="overflow-y-auto">
            <Credits />
          </div>
        </div> */}
      </PageContent>
    </>
  )
}
