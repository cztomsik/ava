import { useCallback, useEffect } from "preact/hooks"
import { effect, signal, useSignal } from "@preact/signals"
import { jsonLines } from "../_util"

export const selectedModel = signal(localStorage.getItem("selectedModel") ?? "")
effect(() => localStorage.setItem("selectedModel", selectedModel.value))

interface GenerateOptions {
  trimFirst?: boolean
  maxTokens?: number
  temperature?: number
  repeat_n_last?: number
  repeat_penalty?: number
  add_bos?: boolean
  stop_eos?: boolean
  stop?: string[]
}

export const useGenerate = () => {
  const ctrl = useSignal<AbortController | null>(null)
  const data = useSignal<any>(null)
  const result = useSignal("")
  const abort = useCallback(() => ctrl.value?.abort(), [])
  useEffect(() => abort, []) // Cancel any generation when the component is unmounted

  const generate = useCallback(async (prompt, { trimFirst = true, maxTokens = 2048, ...sampling }: GenerateOptions = {}) => {
    ctrl.value?.abort()
    const thisCtrl = (ctrl.value = new AbortController())
    data.value = { status: "Sending..." }
    result.value = ""

    try {
      let tokens = 0

      for await (let d of await callApi({ model: selectedModel.value, prompt, sampling }, ctrl.value.signal)) {
        data.value = d

        if ("error" in d) {
          throw new Error(`Unexpected error: ${d.error}`)
        }

        if ("content" in d) {
          // Strip the initial space which is always emitted at the beginning of the stream
          if (trimFirst) {
            d.content = d.content.trimStart()
            trimFirst = false
          }

          result.value += d.content

          if (++tokens >= maxTokens) {
            break
          }
        }
      }
    } catch (e) {
      if (e.code !== DOMException.ABORT_ERR) {
        throw e
      }
    } finally {
      data.value = null
      // stop the http request if it's still running
      if (!thisCtrl.signal.aborted) thisCtrl.abort()
    }

    return result.value
  }, [])

  return { generate, data, result, abort } as const
}

async function callApi(params, signal: AbortSignal) {
  if (!params.model) {
    return noModelSelected()
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    body: JSON.stringify(params),
    signal,
  })

  return jsonLines(response.body!.getReader())
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
    await new Promise(resolve => setTimeout(resolve, 30))
  }
}
