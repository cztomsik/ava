import { useCallback, useEffect } from "preact/hooks"
import { useSignal } from "@preact/signals"

export const useGenerate = () => {
  const ctrl = useSignal(null)
  const loading = ctrl.value && !ctrl.value.signal.aborted

  const abort = useCallback(() => {
    ctrl.value?.abort()
    ctrl.value = null
  }, [])

  const generate = useCallback(prompt => {
    ctrl.value?.abort()
    ctrl.value = new AbortController()

    return generateCompletions(prompt, ctrl.value.signal, abort)
  }, [])

  // cancel any generation when the component is unmounted
  useEffect(() => {
    return () => ctrl.value?.abort()
  }, [])

  return { generate, loading, abort } as const
}

async function* generateCompletions(prompt, signal?: AbortSignal, onComplete?: () => void) {
  const response = await fetch("/api/completion", {
    method: "POST",
    body: JSON.stringify({ prompt }),
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

    yield (content += token)
  }

  onComplete?.()
}

async function* chunks(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()

  for (let res; !(res = await reader.read()).done; ) {
    yield decoder.decode(res.value)
  }
}
