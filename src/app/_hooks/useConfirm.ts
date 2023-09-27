import { useCallback } from "preact/hooks"

export const useConfirm = <A extends Array<any>>(message: string, callback: (...args: A) => void, deps: any[]) => {
  return useCallback((...args: A) => {
    if (window.confirm(message)) {
      callback(...args)
    }
  }, deps)
}
