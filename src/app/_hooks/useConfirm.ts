// NOTE: useCallback() was here but it was a footgun
export const useConfirm = <A extends Array<any>>(message: string, callback: (...args: A) => void) => {
  return (...args: A) => {
    if (window.confirm(message)) {
      callback(...args)
    }
  }
}
