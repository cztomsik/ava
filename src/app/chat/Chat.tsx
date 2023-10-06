import { useCallback } from "preact/hooks"
import { Page } from "../_components"
import { router } from "../router"
import { ChatList } from "./ChatList"
import { ChatSession } from "./ChatSession"

export const Chat = ({ params: { id } }) => {
  const handleSelect = useCallback(id => router.navigate(`/chat/${id}`), [])

  // do not use this in PageContent, it doesn't work and it messes up the onInput event
  const focusInput = useCallback((e: KeyboardEvent) => {
    if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
      const input = e.currentTarget!.parentElement!.querySelector("textarea")!
      e.preventDefault()
      input.focus()
      input.value += e.key
    }
  }, [])

  return (
    <Page>
      <ChatList class="max-md:hidden" value={id} onSelect={handleSelect} onKeyPress={focusInput} />
      <ChatSession id={id} />
    </Page>
  )
}
