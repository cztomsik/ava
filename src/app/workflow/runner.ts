import { signal } from "@preact/signals"
import { generate } from "../_hooks/useGenerate"
import { parseHTML } from "../_util"
import { examples } from "./_examples"

// TODO: this should be implemented on the server side
const handlers = {
  wait: ({ seconds }) => new Promise(resolve => setTimeout(resolve, seconds * 1000)),

  generate: (opts, input) => {
    const result = signal("")
    const status = signal(null)
    return generate({ ...opts, prompt: input }, result, status)
  },

  instruction: ({ instruction, ...opts }, input) => {
    return handlers.generate(opts, `ASSISTANT: ${input}\n\nUSER: ${instruction}\n\nASSISTANT: Sure!`)
  },

  http_request: ({ url }) => fetch("/api/proxy", { method: "POST", body: JSON.stringify(url) }).then(res => res.text()),

  query_selector: ({ selector, limit = 2, clean = true }, input) =>
    [...parseHTML(input, clean).querySelectorAll(selector)]
      .slice(0, limit)
      .map(el => el.innerHTML)
      .join(""),
} as const

export const runWorkflow = async (id: number) => {
  const workflow = examples.find(w => w.id === id)

  if (!workflow) {
    throw new Error(`Workflow with id ${id} not found`)
  }

  const runStep = async (step, input) => {
    for (const k in handlers) {
      if (k in step) {
        console.log("Running step", step, input)
        const res = await handlers[k](step[k], input)
        console.log("Step result", res)

        return res
      }
    }

    alert("TODO: implement step" + JSON.stringify(step))
  }

  let input = null
  for (const step of workflow.steps) {
    input = await runStep(step, input)
  }
}
