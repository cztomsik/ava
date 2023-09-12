import { Button, Form, FormGrid, PageContent, PageHeader } from "../_components"
import { examples } from "./_examples"

export const QuickTool = ({ params: { id } }) => {
  const spec = examples[id]

  const VAR = /\{\{(\w+)\}\}/g
  const variableNames = spec.prompt.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const result = ""

  return (
    <>
      {/* TODO: maybe we can re-introduce page header here, just for the sake of quick tools description */}
      <PageHeader title={spec.name}>
        <Button href="./edit">Edit</Button>
      </PageHeader>

      <PageContent>
        <Form class="row" onSubmit={() => alert("TODO")}>
          <FormGrid class="col">
            {variableNames.map((name, i) => (
              <>
                <label class="text-capitalize">{name}</label>
                {name.endsWith("text") ? <textarea rows={5} /> : <input type="text" />}
              </>
            ))}

            <div />
            <Button submit>Generate</Button>
          </FormGrid>

          <div class="col overflow-auto">
            <pre class="card p-3">{result}</pre>
          </div>
        </Form>
      </PageContent>
    </>
  )
}
