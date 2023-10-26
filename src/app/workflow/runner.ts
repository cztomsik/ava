import { signal } from "@preact/signals"
import { generate } from "../_hooks/useGenerate"
import { humanDuration, parseHTML } from "../_util"
import { examples } from "./_examples"

export const runLog = signal([] as any[])
const log = item => (runLog.value = [...runLog.value, item])

// TODO: this should be implemented on the server side
const handlers = {
  wait: ({ duration }) => {
    log(`Wait for ${humanDuration(duration)}`)
    return new Promise(resolve => setTimeout(resolve, duration * 1000))
  },

  generate: (opts, input) => {
    const result = signal("")
    const status = signal(null)

    log(`Generate "${input.slice(0, 100)}..."`)
    log(status)
    log(result)
    return generate({ ...opts, prompt: input }, result, status)
  },

  instruction: ({ instruction, ...opts }, input) => {
    log(`Instruction "${instruction.slice(0, 100)}"`)
    log(`Input "${input.slice(0, 100)}"`)
    return handlers.generate(opts, `ASSISTANT: ${input}\n\nUSER: ${instruction}\n\nASSISTANT: Sure!`)
  },

  http_request: ({ url }) => {
    log(`HTTP request ${url}`)
    return fetch("/api/proxy", { method: "POST", body: JSON.stringify(url) }).then(res => res.text())
  },

  query_selector: ({ selector, limit = 2, clean = true }, input) => {
    log(`Query selector ${selector} on ${input.slice(0, 100)}...`)

    return [...parseHTML(input, clean).querySelectorAll(selector)]
      .slice(0, limit)
      .map(el => el.innerHTML)
      .join("")
  },
} as const

export const runWorkflow = async (id: number) => {
  const workflow = examples.find(w => w.id === id)

  if (!workflow) {
    throw new Error(`Workflow with id ${id} not found`)
  }

  runLog.value = ["Running workflow " + id]

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
