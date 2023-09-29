import { useCallback, useEffect } from "preact/hooks"
import { effect, signal, useSignal } from "@preact/signals"
import { jsonLines } from "../_util"

export const selectedModel = signal(localStorage.getItem("selectedModel") ?? "")
effect(() => localStorage.setItem("selectedModel", selectedModel.value))

export const useGenerate = () => {
  const ctrl = useSignal(null)
  const data = useSignal(null)
  const result = useSignal("")
  const abort = useCallback(() => ctrl.value?.abort(), [])
  useEffect(() => abort, []) // Cancel any generation when the component is unmounted

  const generate = useCallback(async (prompt, { stop = null, trimFirst = true, maxTokens = 2048 } = {}) => {
    let stopQueue = stop?.slice()
    ctrl.value?.abort()
    const thisCtrl = (ctrl.value = new AbortController())
    data.value = { status: "Sending..." }
    result.value = ""

    try {
      let tokens = 0

      for await (let d of await callApi(selectedModel.value, prompt, ctrl.value.signal)) {
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

          if (stop) {
            if (stopQueue[0] === d.content) {
              stopQueue.shift()
              if (stopQueue.length === 0) break
              else continue
            } else stopQueue = stop.slice()
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

async function callApi(model: string, prompt: string, signal: AbortSignal) {
  if (!model) {
    return noModelSelected()
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    body: JSON.stringify({ model, prompt }),
    signal,
  })

  return jsonLines(response.body.getReader())
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
