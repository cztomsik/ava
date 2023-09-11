import { Signal } from "@preact/signals"
import { useEffect } from "preact/hooks"

export const API_URL = `${window.location.protocol}//${window.location.host}/api`

const cache: Map<string, WeakRef<Context>> = new Map()

interface Context {
  data: any
  loading: boolean
  refetch: () => Promise<void>
  post: (row: any) => Promise<void>
  del: (row: any) => Promise<void>
}

export const useApi = (path: string) => {
  const context = cache.get(path)?.deref() ?? createContext(path)
  useEffect(() => void context.refetch(), [])

  return context
}

const createContext = (path: string) => {
  const state = new Signal({ data: null, loading: false })

  const context = {
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
