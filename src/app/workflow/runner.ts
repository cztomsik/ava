// TODO: this should be implemented on the server side

import { parseHTML } from "../_util"
import { examples } from "./_examples"

const handlers = {
  wait: ({ seconds }) => new Promise(resolve => setTimeout(resolve, seconds * 1000)),

  generate: () => alert("TODO: implement generate"),

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

  let input = null
  for (const step of workflow.steps) {
    input = await runStep(step, input)
  }
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
