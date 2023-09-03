import { useCallback, useEffect } from "preact/hooks"
import { effect, signal, useSignal } from "@preact/signals"

export const selectedModel = signal(localStorage.getItem("selectedModel") ?? "")
effect(() => localStorage.setItem("selectedModel", selectedModel.value))

export const useGenerate = () => {
  const ctrl = useSignal(null)
  const data = useSignal(null)
  const result = useSignal("")
  const abort = useCallback(() => ctrl.value?.abort(), [])
  useEffect(() => abort, []) // Cancel any generation when the component is unmounted

  const generate = useCallback(async function* (prompt, { stop = null, trimFirst = true } = {}) {
    let stopQueue = stop?.slice()
    ctrl.value?.abort()
    ctrl.value = new AbortController()
    data.value = { status: "Sending..." }
    yield (result.value = "")

    try {
      for await (let d of await callApi(selectedModel.value, prompt, ctrl.value.signal)) {
        data.value = d

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

          yield (result.value += d.content)
        }
      }
    } catch (e) {
      if (e.code !== DOMException.ABORT_ERR) {
        throw e
      }
    } finally {
      data.value = null
    }
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
    headers: {
      Connection: "keep-alive",
      "Content-Type": "application/json",
    },
    signal,
  })

  return jsonLines(response.body.getReader())
}

async function* jsonLines(reader: ReadableStreamDefaultReader<Uint8Array>) {
  for await (const chunk of chunks(reader)) {
    for (const line of chunk.split("\n")) {
      if (line) yield JSON.parse(line)
    }
  }
}

async function* chunks(reader: ReadableStreamDefaultReader<Uint8Array>, decoder = new TextDecoder()) {
  for (let res; !(res = await reader.read()).done; ) {
    yield decoder.decode(res.value)
  }
}

async function* noModelSelected() {
  const msg = `
    **No model selected.**
    Please select a model from the dropdown in the bottom left.

    Go to **[Settings](/settings)** for more information.
  `

  for (const word of msg.split(/\b/g)) {
    yield word
    await new Promise(resolve => setTimeout(resolve, 30))
  }
}
