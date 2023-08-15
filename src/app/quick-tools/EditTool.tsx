import { Button, Form, Grid, PageContent, PageHeader } from "../_components"
import { examples } from "./examples"

export const EditTool = ({ params: { id } }) => {
  const spec = examples[id]

  return (
    <>
      <PageHeader title="Edit Tool" description="Edit Tool"></PageHeader>

      <PageContent>
        <Form onSubmit={() => alert("TODO")}>
          <Grid cols="auto 1fr">{"TODO"}</Grid>

          <Button submit>Save</Button>
          <Button>Cancel</Button>
        </Form>
      </PageContent>
    </>
  )
}
