import { Button, Form, FormGrid, PageContent, PageHeader } from "../_components"
import { examples } from "./_examples"

export const QuickTool = ({ params: { id } }) => {
  const spec = examples[id]

  const VAR = /\{\{(\w+)\}\}/g
  const variableNames = spec.prompt.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const result = ""

  return (
    <>
      <PageHeader title={spec.name} description={spec.description}>
        <Button href="./edit" class="ms-auto">
          Edit
        </Button>
      </PageHeader>
      <PageContent>
        <div class="row">
          <div class="col">
            <Form class="" onSubmit={() => alert("TODO")}>
              <FormGrid class="mb-4">
                {variableNames.map((name, i) => (
                  <>
                    <label class="text-capitalize">{name}</label>
                    {name.endsWith("text") ? (
                      <textarea class="form-control" rows={5} />
                    ) : (
                      <input type="text" class="form-control" />
                    )}
                  </>
                ))}
              </FormGrid>

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
