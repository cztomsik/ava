import { PenSquare } from "lucide"
import {
  AutoScroll,
  Button,
  Form,
  FormGrid,
  GenerationProgress,
  IconButton,
  Markdown,
  Page,
  TextArea,
  TextField,
} from "../_components"
import { useGenerate } from "../_hooks"
import { err, parseVars, template } from "../_util"
import { router } from "../router"
import { examples } from "./_examples"
import { humanize } from "../_util/human"

export const QuickTool = ({ params: { id } }) => {
  const { generate, result, ...progress } = useGenerate()

  const tool = examples.find(t => t.id === +id) ?? err("Tool not found")
  const variableNames = parseVars(tool.prompt)

  const handleSubmit = data => generate({ prompt: template(tool.prompt, data) })

  return (
    <>
      <Page.Header title={tool.name}>
        <IconButton title="Edit" icon={PenSquare} onClick={() => router.navigate(`/quick-tools/${id}/edit`)} />
      </Page.Header>

      <Page.Content class="!p-0 md:(grid divide-x) grid-cols-2 divide-gray-7">
        <Form class="bg-gray-2 p-4 pt-8 vstack" onSubmit={handleSubmit}>
          <p class="py-2 text-neutral-11 text-center">{tool.description}</p>

          <FormGrid class="mt-4 w-full max-w-lg self-center">
            {variableNames.map(name => (
              <>
                <label>{humanize(name)}</label>
                {name.endsWith("text") ? <TextArea name={name} rows={10} /> : <TextField name={name} />}
              </>
            ))}

            <div />
            <Button submit>Generate</Button>
          </FormGrid>
        </Form>

        <div class="vstack overflow-hidden">
          <h3 class="px-4 py-2 uppercase font-medium text(sm neutral-11)">Result</h3>
          <div class="px-4 py-2 overflow-auto">
            {result.value === "" && <p class="text-neutral-11">Click generate to see the result</p>}

            <Markdown input={result.value} class="mb-2" />
            <GenerationProgress {...progress} />
            <AutoScroll />
          </div>
        </div>
      </Page.Content>
    </>
  )
}
