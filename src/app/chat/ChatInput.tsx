import { useCallback } from "preact/hooks"
import { SendHorizontal } from "lucide"
import { AutoGrowTextarea, Form, IconButton } from "../_components"
import { useChatContext } from "./useChat"

export const ChatInput = () => {
  const chat = useChatContext()

  const handleKeyDown = useCallback(
    e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        chat.send()
      }
    },
    [chat]
  )

  return (
    <Form class="relative" onSubmit={chat.send} data-value={chat.input}>
      <AutoGrowTextarea
        class="py-2 pr-16 bg-transparent"
        rows={1}
        placeholder="Ask anything..."
        value={chat.input}
        onInput={e => (chat.input.value = e.target!.value)}
        onKeyDown={handleKeyDown}
      />
      <IconButton title="Send" icon={SendHorizontal} class="absolute bottom-1 right-1" submit />
    </Form>
  )
}
