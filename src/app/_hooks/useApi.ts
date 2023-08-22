import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"

export const useApi = basePath => {
  const baseUrl = `/api/${basePath}`

  const signal = useSignal({
    data: null,
    error: null,
    loading: false,
  })

  const refetch = async () => {
    signal.value = { ...signal.value, error: null, loading: true }
    signal.value = { ...signal.value, data: await fetch(baseUrl).then(res => res.json()), loading: false }
  }

  useEffect(() => {
    refetch()
  }, [])

  return { ...signal.value, refetch }
}
