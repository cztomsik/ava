import { Signal } from "@preact/signals"
import { useEffect } from "preact/hooks"

export const API_URL = `${window.location.protocol}//${window.location.host}/api`

const cache: Map<string, WeakRef<any>> = new Map()

type Context<T> = ReturnType<typeof createContext<T>>

export const getApiContext = <T = any>(path: string) => cache.get(path)?.deref() ?? createContext<T>(path)

export const useApi = <T = any>(path: string | null) => {
  const context: Context<T> = path && getApiContext(path)
  useEffect(() => void context?.refetch(), [path])

  return context ?? ({} as Context<T>)
}

const createContext = <T>(path: string) => {
  // true will prevent flash of empty state before we start fetching
  const state = new Signal({ data: undefined as T | undefined, loading: true })

  // dedupe refetch calls during the same tick
  let p: any = null

  const context = {
    get data() {
      return state.value.data
    },

    set data(data: T | undefined) {
      state.value = { ...state.value, data }
    },

    get loading() {
      return state.value.loading
    },

    async refetch() {
      state.value = { ...state.value, loading: true }
      state.value = {
        ...state.value,
        data: await (p ?? (p = Promise.resolve().then(() => ((p = null), callApi(path))))),
        loading: false,
      }
    },

    async post(row: any) {
      try {
        return await callApi(path, { method: "POST", body: JSON.stringify(row) })
      } finally {
        await invalidate(path)
      }
    },

    async put(row: any) {
      try {
        return await callApi(path, { method: "PUT", body: JSON.stringify(row) })
      } finally {
        await invalidate(path)
      }
    },

    async putAt(id: any, row: any) {
      try {
        return await callApi(`${path}/${id}`, { method: "PUT", body: JSON.stringify(row) })
      } finally {
        await invalidate(path)
      }
    },

    async del(id?) {
      try {
        return await callApi(id ? `${path}/${id}` : path, { method: "DELETE" })
      } finally {
        await invalidate(id ? path : path.split("/").slice(0, -1).join("/"))
      }
    },
  }

  cache.set(path, new WeakRef(context))
  return context
}

const callApi = async (path: string, options: RequestInit = {}) => {
  const res = await window.fetch(`${API_URL}/${path}`, options)

  return res.headers.get("Content-Type")?.startsWith("application/json") ? res.json() : res.text()
}

const invalidate = (path: string) =>
  Promise.all([...cache.entries()].filter(([key]) => path.startsWith(key)).map(([_, cx]) => cx.deref()?.refetch()))
