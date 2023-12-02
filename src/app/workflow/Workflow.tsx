import { createContext } from "preact"
import { useContext } from "preact/hooks"
import { useSignal } from "@preact/signals"
import { Clock, Cloud, MousePointerSquare, Play, Repeat2, TableProperties, Wand2 } from "lucide"
import { Field, Form, FormGrid, Icon, IconButton, Page } from "../_components"
import { err, humanDuration, humanize } from "../_util"
import { examples } from "./_examples"
import { handlers, runWorkflow, stepDefaults } from "./runner"

const SelectionContext = createContext({ selection: null, select: null } as any)

export const Workflow = ({ params }) => {
  const workflow = examples.find(w => w.id === +params.id) ?? err("Unknown workflow") // TODO: useApi()

  const ctx = {
    selection: useSignal(null as any),
    select: step => (ctx.selection.value = step),
  }

  return (
    <Page>
      <Page.Header title={workflow.name}>
        <IconButton title="Run" icon={Play} onClick={() => runWorkflow(workflow)} />
      </Page.Header>

      <Page.Content class="bg-neutral-2 items-center py-10 gap-4">
        {!workflow.steps.length && <p class="text-neutral-10 text-sm">Add steps from the right to build your workflow.</p>}

        <SelectionContext.Provider value={ctx}>
          {workflow.steps.map(s => (
            <Step step={s} />
          ))}
        </SelectionContext.Provider>
      </Page.Content>

      <Page.DetailsPane sizes={[200, 350, 600]}>
        <PropsPane step={ctx.selection.value} />
        <StepCatalog />
      </Page.DetailsPane>
    </Page>
  )
}

const Step = ({ step }) => {
  const { selection, select } = useContext(SelectionContext)
  const [[kind, props]] = Object.entries(step)
  const [title, icon, subtitle] = renderers[kind](props)

  const selected = selection?.value === step

  return (
    <div
      // translate-x-0 is a hack to make the draggable transparent
      class={`hstack gap-2 p-2 bg-neutral-1 border-2 translate-x-0 rounded-md ${
        selected ? "border-blue-8 ring(& blue-5)" : "border-neutral-7"
      }`}
      onClick={() => select(step)}
      draggable
    >
      <div class={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? "bg-blue-5" : "bg-neutral-3"}`}>
        <Icon icon={icon} />
      </div>
      <div class="overflow-hidden">
        <h3 class={`text-${selected ? "primary-12" : "neutral-10"} text-sm uppercase font-medium truncate`}>{title}</h3>
        <div class="text-neutral-12 max-w-xs">{subtitle}</div>
      </div>
    </div>
  )
}

const PropsPane = ({ step }) => (
  <>
    <h3 class="px-3 py-2 text-neutral-10 text-sm uppercase font-medium">
      {step ? Object.keys(step)[0] : "No step selected"}
    </h3>

    <div class="px-3 py-2 mb-4">
      {step ? (
        <Form
          data={step[Object.keys(step)[0]]}
          onSubmit={data => console.log(data)}
          onChange={data => Object.assign(step[Object.keys(step)[0]], data)}
        >
          <FormGrid>
            {Object.keys(step[Object.keys(step)[0]]).map(k => (
              <>
                <label class="control-label capitalize">{humanize(k)}</label>
                <Field name={k} />
              </>
            ))}
          </FormGrid>
        </Form>
      ) : (
        <p>Click on a step to edit its properties, or drag a step from the sidebar to add it to the workflow.</p>
      )}
    </div>
  </>
)

const StepCatalog = () => (
  <div>
    <h3 class="px-3 py-2 text-neutral-10 text-sm uppercase font-medium">Step Catalog</h3>

    <div class="px-3 py-2 vstack gap-2">
      {Object.keys(handlers).map(k => (
        <Step step={{ [k]: stepDefaults[k] }} />
      ))}
    </div>
  </div>
)

type Renderers = {
  [k in keyof typeof handlers]: (s: (typeof stepDefaults)[k]) => [string, typeof Clock, string?]
}

const renderers: Renderers = {
  wait: s => [`Wait ${humanDuration(s.duration)}`, Clock],
  generate: s => ["Generate", Wand2],
  instruction: s => ["Instruction", Wand2, s.instruction],
  http_request: s => ["HTTP Request", Cloud, s.url],
  query_selector: s => ["Query Selector", MousePointerSquare, s.selector],
  // extract: s => ["Extract", TableProperties, s.fields.join(", ")],
  // for_each: s => ["For Each", Repeat2],
}
