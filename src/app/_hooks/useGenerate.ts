import { useCallback, useEffect, useMemo } from "preact/hooks"
import { effect, signal, useSignal } from "@preact/signals"
import { api } from "../api"
import { dedent } from "../_util"

export const selectedModel = signal<string | null>(localStorage.getItem("selectedModel") || null)
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

// TODO: read this from endpoint? model-specific?
export const defaultSampling: GenerateOptions["sampling"] = {
  temperature: 0.7,
  top_k: 40,
  top_p: 0.5,
  repeat_n_last: 256,
  repeat_penalty: 1.05,
  presence_penalty: 0,
  freq_penalty: 0,
  add_bos: true,
  stop_eos: true,
  stop: [],
  json: false,
}

export const generate = async (options: GenerateOptions, result, status, signal?: AbortSignal) => {
  try {
    status.value = null
    result.value = options.start_with ?? ""

    const res = selectedModel.value
      ? jsonLines(
          (await api.createCompletion({ model: selectedModel.value, stream: true, ...options, signal })).body!.getReader()
        )
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

      if ("choices" in d) {
        result.value = d.choices[0].message.content
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

  useEffect(() => () => ctrl.value?.abort(), deps) // Cancel when deps change or the component is unmounted

  return useMemo(() => {
    const result = signal("")
    const status = signal<any>(null)

    return {
      result,

      generate: opts => {
        ctrl.value?.abort()
        ctrl.value = new AbortController()

        return generate(opts, result, status, ctrl.value.signal).finally(() => (ctrl.value = null))
      },

      get status() {
        return status.value
      },

      get abort() {
        return ctrl.value?.abort.bind(ctrl.value)
      },
    } as const
  }, deps)
}

async function* noModelSelected() {
  const msg = dedent`
    Hey there! 👋
    It looks like you haven't selected a model yet.
    Please select a model from the dropdown in the bottom left.

    In case you don't have a model yet, you can download one in the **[Models](/models)** tab.
  `

  for (const content of msg.split(/\b/g)) {
    yield { content }
    await new Promise(resolve => setTimeout(resolve, 16))
  }
}

export async function* jsonLines(reader: ReadableStreamDefaultReader<Uint8Array>) {
  let buf = ""

  for await (let chunk of chunks(reader)) {
    if (buf) chunk = buf + chunk
    const lines = chunk.split("\n")
    buf = lines.pop()!

    for (const line of lines) {
      if (line) yield JSON.parse(line)
    }
  }
}

async function* chunks(reader: ReadableStreamDefaultReader<Uint8Array>, decoder = new TextDecoder()) {
  for (let res; !(res = await reader.read()).done; ) {
    yield decoder.decode(res.value, { stream: !res.done })
  }
}
