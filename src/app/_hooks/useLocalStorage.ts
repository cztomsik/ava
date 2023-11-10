import { useMemo } from "preact/hooks"
import { Signal, effect } from "@preact/signals"

/**
 * Returns a Signal that is synced with localStorage, unless the key is null.
 */
export const useLocalStorage = <V>(key: string | null, initialValue: V) => {
  return useMemo(() => {
    const signal = new Signal<V>(key ? JSON.parse(localStorage.getItem(key) as any) ?? initialValue : initialValue)

    effect(() => {
      if (key) {
        localStorage.setItem(key, JSON.stringify(signal.value))
      }
    })

    return signal
  }, [key])
}
