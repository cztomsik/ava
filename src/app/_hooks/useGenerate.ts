import { useCallback, useEffect, useMemo } from "preact/hooks"
import { effect, signal, useSignal } from "@preact/signals"
import { callApi } from "./useApi"

export const selectedModel = signal<number | null>(+localStorage.getItem("selectedModel")! || null)
effect(() => localStorage.setItem("selectedModel", "" + (selectedModel.value ?? "")))

export interface GenerateOptions {
  prompt: string
  start_with?: string
  max_tokens?: number
  trim_first?: boolean
  sampling?: {
    top_k?: number
    top_p?: number
    temperature?: number
    repeat_n_last?: number
    repeat_penalty?: number
    presence_penalty?: number
    freq_penalty?: number
    add_bos?: boolean
    stop_eos?: boolean
    stop?: string[]
    json: boolean
  }
}

export const generate = async (options: GenerateOptions, result, status, signal?: AbortSignal) => {
  try {
    status.value = null
    result.value = options.start_with ?? ""

    const res = selectedModel.value
      ? await callApi("generate", {
          method: "POST",
          body: JSON.stringify({ model_id: selectedModel.value, ...options }),
          stream: true,
          signal,
        })
      : await noModelSelected()

    for await (let d of res) {
      if ("status" in d) {
        status.value = d.status
      }

      if ("error" in d) {
        throw new Error(`Unexpected error: ${d.error}`)
      }

      if ("content" in d) {
        result.value += d.content
      }
    }
  } catch (e) {
    if (e.code !== DOMException.ABORT_ERR) {
      throw e
    }
  } finally {
    status.value = null
  }

  return result.value
}

export const useGenerate = (deps = [] as any[]) => {
  const ctrl = useSignal<AbortController | null>(null)
  const abort = useCallback(() => ctrl.value?.abort(), [])
  useEffect(() => abort, deps) // Cancel when deps change or the component is unmounted

  return useMemo(() => {
    const result = signal("")
    const status = signal<any>(null)

    const gen = opts => {
      abort()
      ctrl.value = new AbortController()

      return generate(opts, result, status, ctrl.value.signal)
    }

    return { generate: gen, result, status, abort } as const
  }, deps)
}

async function* noModelSelected() {
  const msg = `
    Hey there! 👋
    It looks like you haven't selected a model yet.
    Please select a model from the dropdown in the bottom left.

    In case you don't have a model yet, you can download one in the **[Settings](/settings)** tab.

    In the meantime, here's a little poem for you:

    > Roses are red
    > Violets are blue
    > I'm a bot
    > Writing poetry for you
  `

  for (const content of msg.split(/\b/g)) {
    yield { content }
    await new Promise(resolve => setTimeout(resolve, 16))
  }
}
