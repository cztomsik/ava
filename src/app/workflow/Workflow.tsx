import { Clock, Cloud, MousePointerSquare, Play, Repeat2, TableProperties, Wand2 } from "lucide"
import { useSignal } from "@preact/signals"
import { Icon, IconButton, Page, TableInput } from "../_components"
import { humanDuration } from "../_util"
import { useAriaList, useResize } from "../_hooks"
import { WorkflowContext, useWorkflow, useWorkflowContext } from "./useWorkflow"
import { data } from "./_examples"

export const Workflow = ({ params }) => {
  const workflow = useWorkflow(+params.id)
  const list = useAriaList()

  const width = useSignal(350)
  const { style, resizeHandle } = useResize({ width, minWidth: 250, maxWidth: 700, position: "left" })

  return (
    <WorkflowContext.Provider value={workflow}>
      <Page>
        <Page.Header title={workflow.data.name}>
          <IconButton title="Run" icon={Play} onClick={workflow.runAll} />
        </Page.Header>

        <div class="flex overflow-hidden">
          <div class="flex-1 vstack items-center bg-gray-2 py-10 overflow-auto" {...list}>
            <Steps steps={workflow.data.steps} />
          </div>

          <div class="p-4 relative border(l-2 gray-7) overflow-y-auto" style={style}>
            {resizeHandle}

            <h3 class="text-gray-10 text-sm uppercase font-medium">Run Log</h3>

            <TableInput value={data} />
          </div>
        </div>
      </Page>
    </WorkflowContext.Provider>
  )
}

const Steps = ({ class: className = "", steps }) => {
  const workflow = useWorkflowContext()

  return (
    <div class={`vstack items-start ${className}`}>
      {steps.map(s => (
        <Step
          selected={workflow.selectedStep === s}
          onSelect={() => workflow.selectStep(s)}
          {...renderers[Object.keys(s)[0]](Object.values(s)[0])}
        />
      ))}
    </div>
  )
}

const Step = ({ icon, title, subtitle = "", children = null as any, selected, onSelect }) => (
  <>
    <div
      role="listitem"
      onFocus={onSelect}
      class={`hstack gap-3 w-72 px-4 py-2 bg-gray-1 rounded-md border-2 ${
        selected ? "border-blue-8 ring(& blue-5)" : "border-gray-7"
      }`}
      {...(selected ? { tabIndex: 0, "aria-selected": true } : { tabIndex: -1 })}
    >
      <div class={`w-10 h-10 rounded-full flex items-center justify-center ${selected ? "bg-blue-5" : "bg-gray-3"}`}>
        <Icon icon={icon} />
      </div>
      <div class="overflow-hidden">
        <h3 class="text-gray-10 text-sm uppercase font-medium truncate">{title}</h3>
        <div class="text-gray-12 truncate">{subtitle}</div>
      </div>
    </div>

    <div class="ml-10 border(l-2 gray-7 last:0) p-2">{children && <Steps class="pl-6" steps={children} />}</div>
  </>
)

const renderers = {
  wait: ({ duration, title = `Wait ${humanDuration(duration)}` }) => ({ title, icon: Clock }),
  generate: ({ title = "Generate" }) => ({ title, icon: Wand2 }),
  instruction: ({ title = "Instruction", instruction }) => ({ title, icon: Wand2, subtitle: instruction }),
  http_request: ({ title = "HTTP Request", url }) => ({ title, icon: Cloud, subtitle: url }),
  query_selector: ({ title = "Query Selector", selector }) => ({ title, icon: MousePointerSquare, subtitle: selector }),
  extract: ({ fields }) => ({ title: "Extract", icon: TableProperties, subtitle: fields.join(", ") }),
  for_each: ({ title = "For Each", children }) => ({ title, icon: Repeat2, children }),
}
