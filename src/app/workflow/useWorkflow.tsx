import { signal } from "@preact/signals"
import { createContext } from "preact"
import { useContext, useMemo } from "preact/hooks"
import { examples } from "./_examples"

export const WorkflowContext = createContext<ReturnType<typeof useWorkflow>>(null as any)

export const useWorkflowContext = () => useContext(WorkflowContext)

export const useWorkflow = id =>
  useMemo(() => {
    const data = examples.find(w => w.id === id)

    if (!data) {
      throw new Error(`Workflow with id ${id} not found`)
    }

    const selectedStep = signal(data!.steps[0])

    return {
      get data() {
        return data
      },

      get selectedStep() {
        return selectedStep.value
      },

      selectStep(step) {
        selectedStep.value = step
      },

      runStep(step) {
        // TODO
      },

      runAll() {
        // TODO
      },
    }
  }, [id])
