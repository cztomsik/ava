import { Signal } from "@preact/signals"
import { useMemo } from "preact/hooks"

type AnyRes = Record<string | number | typeof Symbol.iterator, any>
type Query<T> = PromiseLike<T> & { url: string }

const contextMap: Map<string, WeakRef<any>> = new Map()

export const useQuery = <T extends AnyRes>(query: Query<T> | null | undefined): ReturnType<typeof createContext<T>> =>
  useMemo(() => {
    const ctx = query ? contextMap.get(query.url)?.deref() ?? createContext(query) : ({} as any)
    return ctx.refetch?.(), ctx
  }, [query?.url])

const createContext = <T>(query: Query<T>) => {
  const state = new Signal({ data: undefined as T, fetching: false })

  // Dedupe refetch calls during the same tick
  let p: any = null

  const context = {
    get data() {
      return state.value.data
    },

    get loading() {
      return state.value.fetching && state.value.data === undefined
    },

    get fetching() {
      return state.value.fetching
    },

    async refetchIfStale() {
      if (state.value.fetching || state.value.data !== undefined) {
        await context.refetch()
      }
    },

    async refetch() {
      state.value = { ...state.value, fetching: true }
      state.value = {
        ...state.value,
        data: await (p ?? (p = Promise.resolve().then(() => ((p = null), query)))),
        fetching: false,
      }
    },
  }

  contextMap.set(query.url, new WeakRef(context))
  return context
}

const invalidate = (path: string) =>
  Promise.all(
    [...contextMap.entries()].filter(([key]) => path.startsWith(key)).map(([_, cx]) => cx.deref()?.refetchIfStale())
  )

const fetch = window.fetch
window.fetch = async (url: any, { method = "GET", ...init } = {}) => {
  const res = await fetch(url, { method, ...init })

  if (method !== "GET") {
    await invalidate(method === "DELETE" ? url.split("/").slice(0, -1).join("/") : url)
  }

  return res
}
