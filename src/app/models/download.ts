import { computed, effect, signal, Signal } from "@preact/signals"
import { basename, jsonLines } from "../_util"
import { api } from "../api"

type DownloadJob = { url: string; size: number; progress: Signal<number>; ctrl: AbortController }

export const queue = signal<DownloadJob[]>([])
export const current = computed(() => queue.value[0] ?? null)

export const downloadModel = (url: string) =>
  (queue.value = [...queue.value, { url, size: 0, progress: signal(0), ctrl: new AbortController() }])

export const cancel = (job: DownloadJob) => {
  job.ctrl.abort()
  queue.value = queue.value.filter(j => j !== job)
}

effect(async () => {
  const next = current.value

  if (next) {
    try {
      const { url, ctrl, progress } = next
      const res = await fetch("/api/download", {
        method: "POST",
        body: JSON.stringify({ url }),
        signal: ctrl.signal,
      })

      for await (const d of jsonLines(res.body!.getReader())) {
        if ("error" in d) {
          throw new Error(`Unexpected error: ${d.error}`)
        }

        if ("size" in d) {
          next.size = d.size
        }

        if ("progress" in d) {
          progress.value = d.progress
        }

        if ("path" in d) {
          await api.createModel({ name: basename(url.slice(0, -5)), path: d.path })
        }
      }
    } catch (e) {
      if (e.code !== DOMException.ABORT_ERR) {
        throw e
      }
    } finally {
      // Be extra careful to not remove the wrong job (cancel might have been called)
      queue.value = queue.peek().filter(j => j !== next)
    }
  }
})
