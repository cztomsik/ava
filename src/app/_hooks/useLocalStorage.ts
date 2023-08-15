import { useSignal, effect } from "@preact/signals"

export const useLocalStorage = (key, initialValue) => {
  const signal = useSignal(JSON.parse(localStorage.getItem(key)) ?? initialValue)

  effect(() => {
    localStorage.setItem(key, JSON.stringify(signal.value))
  })

  return signal
}
