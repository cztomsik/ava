import { useCallback, useEffect } from "preact/hooks"
import { effect, signal, useSignal } from "@preact/signals"

export const selectedModel = signal(localStorage.getItem("selectedModel") ?? "")
effect(() => localStorage.setItem("selectedModel", selectedModel.value))

export const useGenerate = () => {
  const ctrl = useSignal(null)
  const loading = ctrl.value && !ctrl.value.signal.aborted

  const abort = useCallback(() => {
    ctrl.value?.abort()
    ctrl.value = null
  }, [])

  const generate = useCallback((prompt, options = {}) => {
    abort()
    ctrl.value = new AbortController()

    return selectedModel.value ? generateCompletions(prompt, options, ctrl.value.signal, abort) : noModelSelected(abort)
  }, [])

  // cancel any generation when the component is unmounted
  useEffect(() => () => ctrl.value?.abort(), [])

  return { generate, loading, abort } as const
}

async function* generateCompletions(prompt, options, signal?: AbortSignal, onComplete?: () => void) {
  const { stop = null } = options
  let stopQueue = stop?.slice()

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({
        model: selectedModel.value,
        prompt,
      }),
      headers: {
        Connection: "keep-alive",
        "Content-Type": "application/json",
      },
      signal,
    })

    let content = ""

    for await (let token of chunks(response.body.getReader())) {
      // strip the initial space which is always emitted at the beginning of the stream
      if (!content) {
        token = token.trimStart()
      }

      if (stop) {
        if (stopQueue[0] === token) {
          stopQueue.shift()

          if (stopQueue.length === 0) {
            break
          } else {
            continue
          }
        } else {
          stopQueue = stop.slice()
        }
      }

      yield (content += token)
    }

    onComplete?.()
  } catch (e) {
    if (e.code !== DOMException.ABORT_ERR) {
      throw e
    }
  }
}

async function* chunks(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()

  for (let res; !(res = await reader.read()).done; ) {
    yield decoder.decode(res.value)
  }
}

async function* noModelSelected(onComplete) {
  const msg = `
    **No model selected.**
    Please select a model from the dropdown in the bottom left.

    Go to **[Settings](/settings)** for more information.
  `
  let content = ""

  for (const word of msg.split(/\b/g)) {
    yield (content += word)
    await new Promise(resolve => setTimeout(resolve, 30))
  }
  onComplete?.()
}
