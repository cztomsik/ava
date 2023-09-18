import { Signal } from "@preact/signals"
import { useEffect } from "preact/hooks"

export const API_URL = `${window.location.protocol}//${window.location.host}/api`

const cache: Map<string, WeakRef<Context<any>>> = new Map()

interface Context<T> {
  data: T | undefined
  loading: boolean
  refetch: () => Promise<void>
  post: (row: any) => Promise<T>
  del: (row: any) => Promise<void>
}

export const getApiContext = <T = any>(path: string) => cache.get(path)?.deref() ?? createContext<T>(path)

export const useApi = <T = any>(path: string | null) => {
  const context: Context<T> = path && getApiContext(path)
  useEffect(() => void context?.refetch(), [path])

  return context ?? ({} as Context<T>)
}

const createContext = <T>(path: string) => {
  // true will prevent flash of empty state before we start fetching
  const state = new Signal({ data: undefined, loading: true })

  const context: Context<T> = {
    get data() {
      return state.value.data
    },

    get loading() {
      return state.value.loading
    },

    async refetch() {
      state.value = { ...state.value, loading: true }
      state.value = { ...state.value, data: await callApi(path), loading: false }
    },

    async post(row: any) {
      try {
        return await callApi(path, { method: "POST", body: JSON.stringify(row) })
      } finally {
        invalidate(path)
      }
    },

    async del(id) {
      try {
        return await callApi(`${path}/${id}`, { method: "DELETE" })
      } finally {
        invalidate(path)
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

const invalidate = (path: string) => {
  for (const [key, value] of cache.entries()) {
    const context = value.deref()

    if (context && key.startsWith(path)) {
      context.refetch()
    }
  }
}
