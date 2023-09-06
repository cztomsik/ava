import { useSignal } from "@preact/signals"
import { useCallback, useEffect } from "preact/hooks"

export const API_URL = `${window.location.protocol}//${window.location.host}/api`

export const useApi = basePath => {
  const baseUrl = `${API_URL}/${basePath}`

  const signal = useSignal({
    data: null,
    error: null,
    loading: false,
  })

  const refetch = useCallback(async () => {
    signal.value = { ...signal.value, error: null, loading: true }
    signal.value = { ...signal.value, data: await fetch(baseUrl).then(res => res.json()), loading: false }
  }, [])

  const post = useCallback(async (data, options = {}) => {
    signal.value = { ...signal.value, error: null, loading: true }
    await fetch(baseUrl, {
      method: "POST",
      body: JSON.stringify(data),
    })
    refetch()
  }, [])

  const del = useCallback(async (id, options = {}) => {
    signal.value = { ...signal.value, error: null, loading: true }
    await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
    })
    refetch()
  }, [])

  useEffect(() => {
    refetch()
  }, [])

  return { ...signal.value, refetch, post, del }
}
