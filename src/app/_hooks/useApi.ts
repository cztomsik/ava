import { Signal } from "@preact/signals"
import { useEffect } from "preact/hooks"

export const API_URL = `${window.location.protocol}//${window.location.host}/api`

const cache: Map<string, WeakRef<any>> = new Map()

type AnyRes = Record<string | number, any>
type Context<T extends AnyRes> = ReturnType<typeof createContext<T>>

export const getApiContext = <T extends AnyRes>(path: string) => cache.get(path)?.deref() ?? createContext<T>(path)

export const useApi = <T extends AnyRes>(path: string | null) => {
  const context: Context<T> = path && getApiContext(path)
  useEffect(() => void context?.refetch(), [path])

  return context ?? ({} as Context<T>)
}

const createContext = <T>(path: string) => {
  // true will prevent flash of empty state before we start fetching
  const state = new Signal({ data: undefined as T | undefined, fetching: true })

  // Dedupe refetch calls during the same tick
  let p: any = null

  const context = {
    get data() {
      return state.value.data
    },

    set data(data: T | undefined) {
      state.value = { ...state.value, data }
    },

    get loading() {
      return state.value.fetching && state.value.data === undefined
    },

    get fetching() {
      return state.value.fetching
    },

    async refetch() {
      state.value = { ...state.value, fetching: true }
      state.value = {
        ...state.value,
        data: await (p ?? (p = Promise.resolve().then(() => ((p = null), callApi(path))))),
        fetching: false,
      }
    },

    // Helpers, there's no difference between calling these and calling callApi directly
    post: (row: any) => callApi(path, { method: "POST", body: JSON.stringify(row) }),
    put: (row: any) => callApi(path, { method: "PUT", body: JSON.stringify(row) }),
    putAt: (id: any, row: any) => callApi(`${path}/${id}`, { method: "PUT", body: JSON.stringify(row) }),
    del: (id?) => callApi(id !== undefined ? `${path}/${id}` : path, { method: "DELETE" }),
  }

  cache.set(path, new WeakRef(context))
  return context
}

export const callApi = async (path: string, { method = "GET", ...init }: RequestInit = {}) => {
  try {
    const res = await window.fetch(`${API_URL}/${path}`, { method, ...init })
    return res.headers.get("Content-Type")?.startsWith("application/json") ? res.json() : res.text()
  } finally {
    if (method !== "GET") {
      await invalidate(method === "DELETE" ? path.split("/").slice(0, -1).join("/") : path)
    }
  }
}

const invalidate = (path: string) =>
  Promise.all([...cache.entries()].filter(([key]) => path.startsWith(key)).map(([_, cx]) => cx.deref()?.refetch()))
