// TODO: this should be implemented on the server side

import { examples } from "./_examples"

const handlers = {
  wait: ({ seconds }) => new Promise(resolve => setTimeout(resolve, seconds * 1000)),

  http_request: ({ url, method, body }) => fetch(url, { method, body }).then(res => res.text()),

  query_selector: ({ input, selector }) =>
    new DOMParser().parseFromString(input, "text/html").querySelector(selector)?.innerHTML,
} as const

export const run = async (id: number) => {
  const workflow = examples.find(w => w.id === id)

  if (!workflow) {
    throw new Error(`Workflow with id ${id} not found`)
  }

  for (const step of workflow.steps) {
    await runStep(step)
  }
}

const runStep = step => {
  for (const k in handlers) {
    if (k in step) {
      return handlers[k](step[k])
    }
  }

  alert("TODO: implement step" + JSON.stringify(step))
}
