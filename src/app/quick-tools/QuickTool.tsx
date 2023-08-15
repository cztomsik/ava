import { Button, Form, Grid, PageContent, PageHeader } from "../_components"
import { examples } from "./examples"

export const QuickTool = ({ params: { id } }) => {
  const spec = examples[id]

  const VAR = /\{\{(\w+)\}\}/g
  const variableNames = spec.prompt.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const result = ""

  return (
    <>
      <PageHeader title={spec.title} description={spec.description}>
        <Button href="edit" class="ms-auto">
          Edit
        </Button>
      </PageHeader>
      <PageContent>
        <div class="row">
          <div class="col">
            <Form class="" onSubmit={() => alert("TODO")}>
              <Grid class="mb-4" cols="auto 2fr">
                {variableNames.map((name, i) => (
                  <>
                    <label class="text-capitalize align-self-center">{name}</label>
                    <input type="text" class="col form-control" />
                  </>
                ))}
              </Grid>

              <Button submit>Generate</Button>
            </Form>
          </div>

          <div class="col overflow-hidden">
            <pre class="card p-3">{result}</pre>
          </div>
        </div>
      </PageContent>
    </>
  )
}
