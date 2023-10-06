import { useMemo } from "preact/hooks"
import { Signal, effect } from "@preact/signals"

export const useLocalStorage = (key, initialValue) => {
  return useMemo(() => {
    const signal = new Signal(JSON.parse(localStorage.getItem(key) as any) ?? initialValue)

    effect(() => {
      localStorage.setItem(key, JSON.stringify(signal.value))
    })

    return signal
  }, [key])
}
