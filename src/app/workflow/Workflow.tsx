import { Clock, Cloud, MousePointerSquare, Play, Repeat2, TableProperties, Wand2 } from "lucide"
import { Icon, IconButton, Page } from "../_components"
import { humanDuration } from "../_util"
import { examples } from "./_examples"
import { runLog, runWorkflow } from "./runner"

export const Workflow = ({ params }) => {
  const id = +params.id
  const workflow = examples.find(w => w.id === id)

  const handleRun = () => {
    runWorkflow(id)
  }

  return (
    <Page>
      <Page.Header title={workflow?.name}>
        <IconButton title="Run" icon={Play} onClick={handleRun} />
      </Page.Header>

      <div class="flex overflow-hidden">
        <div class="flex-1 vstack items-center bg-gray-2 py-10 overflow-auto">
          <Steps steps={workflow?.steps} />
        </div>

        <div class="p-4 border(l-2 gray-7) w-[400px] overflow-y-auto">
          <h3 class="text-gray-10 text-sm uppercase font-medium">Run Log</h3>

          <div class="mt-4 vstack divide-y divide-gray-7 whitespace-pre-wrap">
            {runLog.value.length === 0 && <div class="text-gray-11 py-3">Progress will be shown here.</div>}

            {runLog.value.map(l => (
              <div class="text-gray-11 py-3">{l}</div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  )
}

const Steps = ({ class: className = "", steps }) => (
  <div class={`vstack items-start ${className}`}>
    {steps.map(s => (
      <Step {...renderers[Object.keys(s)[0]](Object.values(s)[0])} />
    ))}
  </div>
)

const Step = ({ icon, title, subtitle = "", selected = false, children = null as any }) => (
  <>
    <div
      class={`hstack gap-3 w-72 px-4 py-2 bg-gray-1 rounded-md border-2 ${
        selected ? "border-blue-8 ring(& blue-5)" : "border-gray-7"
      }`}
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
