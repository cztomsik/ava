import { SquarePen } from "lucide"
import { AutoScroll, Button, Form, FormGrid, IconButton, Markdown, Page, Field } from "../_components"
import { useGenerate, useQuery } from "../_hooks"
import { parseVars, template, humanize } from "../_util"
import { api } from "../api"

export const QuickTool = ({ params: { id } }) => {
  const { generate, result, status, abort } = useGenerate()

  const { data: tool } = useQuery(id && api.getQuickTool(id))

  const handleSubmit = data => generate({ prompt: template(tool.prompt, data) })

  return (
    tool && (
      <Page>
        <Page.Header title={tool.name}>
          <IconButton title="Edit" icon={SquarePen} href={`/quick-tools/${id}/edit`} />
        </Page.Header>

        <Page.Content class="bg-neutral-2">
          <Form class="vstack" onSubmit={handleSubmit}>
            <p class="py-4 text-neutral-11 text-center">{tool.description}</p>

            <FormGrid class="mt-4 w-full max-w-lg self-center">
              {parseVars(tool.prompt).map(name => (
                <>
                  <label>{humanize(name)}</label>
                  {name.endsWith("text") ? <Field as="textarea" name={name} rows={10} /> : <Field name={name} />}
                </>
              ))}

              <div />
              <Button abort={abort} submit>
                Generate
              </Button>
            </FormGrid>
          </Form>
        </Page.Content>

        <Page.DetailsPane sizes={[400, 500, 800]}>
          <div class="vstack overflow-hidden">
            <h3 class="px-4 py-2 uppercase font-medium text(sm neutral-11)">Result</h3>
            <div class="px-4 py-2 overflow-auto">
              <Markdown class="peer" input={status || result} />
              <p class="hidden peer-empty:block text-neutral-11">Click generate to see the result</p>

              <AutoScroll />
            </div>
          </div>
        </Page.DetailsPane>
      </Page>
    )
  )
}
