import { signal } from "@preact/signals"
import { generate } from "../_hooks/useGenerate"
import { parseHTML } from "../_util"

export type Step = (typeof stepDefaults)[keyof typeof stepDefaults]

// TODO: this should be retrieved from the server
export const stepDefaults = {
  wait: { duration: 1 },
  generate: {}, // TODO: opts for sampling, etc.
  instruction: { instruction: "" },
  http_request: { method: "GET", url: "" },
  query_selector: { selector: "", limit: 2, clean: true },
}

type Handlers = {
  [k in keyof typeof stepDefaults]: (opts: (typeof stepDefaults)[k], input: string) => string | Promise<string>
}

// TODO: this should be implemented on the server side
export const handlers: Handlers = {
  wait: ({ duration }) => {
    return new Promise(resolve => setTimeout(resolve, duration * 1000))
  },

  generate: (opts, input) => {
    const result = signal("")
    const status = signal(null)

    return generate({ ...opts, prompt: input }, result, status)
  },

  instruction: ({ instruction, ...opts }, input) => {
    return handlers.generate(opts, `ASSISTANT: ${input}\n\nUSER: ${instruction}\n\nASSISTANT: Sure!`)
  },

  http_request: ({ url }) => {
    return fetch("/api/proxy", { method: "POST", body: JSON.stringify(url) }).then(res => res.text())
  },

  query_selector: ({ selector, limit = 2, clean = true }, input) => {
    return [...parseHTML(input, clean).querySelectorAll(selector)]
      .slice(0, limit)
      .map(el => el.innerHTML)
      .join("")
  },
}

export const runWorkflow = async workflow => {
  const runStep = async (step, input) => {
    for (const k in handlers) {
      if (k in step) {
        const res = await handlers[k](step[k], input)

        return res
      }
    }

    throw new Error(`No handler found for step ${JSON.stringify(step)}`)
  }

  let input = null
  for (const step of workflow.steps) {
    input = await runStep(step, input)
  }
}
