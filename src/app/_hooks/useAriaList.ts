import { useMemo } from "preact/hooks"
import { indexOf } from "../_util"

export const useAriaList = (selector = "[role=listitem]") =>
  useMemo(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const list = e.currentTarget as HTMLElement
      const items = list.querySelectorAll(selector) as NodeListOf<HTMLElement>
      const current = list.querySelector(selector + "[aria-selected=true]") as HTMLElement | null
      const index = indexOf(items, current)

      if (e.key.startsWith("Arrow")) e.preventDefault()
      if (e.key === "ArrowUp") items[index - 1]?.focus()
      if (e.key === "ArrowDown") items[index + 1]?.focus()
    }

    return { role: "list" as const, onKeyDown }
  }, [selector])
