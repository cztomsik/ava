import { effect, signal, Signal } from "@preact/signals"
import { getApiContext } from "../_hooks"
import { basename, jsonLines } from "../_util"

type DownloadItem = { url: string; size: number }

export const queue = signal<DownloadItem[]>([])
export const current = signal<{ url: string; size: number; progress: Signal<number>; ctrl: AbortController } | null>(null)
export const downloadModel = (item: DownloadItem) => (queue.value = [...queue.value, item])

const startDownload = async ({ url, size }) => {
  const ctrl = new AbortController()
  const progress = signal(0)

  current.value = {
    url,
    size,
    progress,
    ctrl,
  }

  try {
    const res = await fetch("/api/download", {
      method: "POST",
      body: JSON.stringify({ url }),
      signal: ctrl.signal,
    })

    for await (const d of jsonLines(res.body!.getReader())) {
      if ("error" in d) {
        throw new Error(`Unexpected error: ${d.error}`)
      }

      if ("progress" in d) {
        progress.value = d.progress
      }

      if ("path" in d) {
        await getApiContext("models").post({ name: basename(url.slice(0, -5)), path: d.path })
      }
    }
  } catch (e) {
    if (e.code !== DOMException.ABORT_ERR) {
      throw e
    }
  } finally {
    current.value = null
  }
}

export const abortCurrent = () => {
  current.value?.ctrl.abort()
  current.value = null
}

effect(() => {
  if (!current.value && queue.value.length) {
    const [next, ...rest] = queue.value
    queue.value = rest
    startDownload(next)
  }
})
