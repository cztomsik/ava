import { css } from "@twind/core"
import { useCallback } from "preact/hooks"
import { SendHorizontal } from "lucide"
import { Form, IconButton } from "../_components"
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
    <Form class={`vstack relative p-2 pr-16 ${autoGrow}`} onSubmit={chat.send} data-value={chat.input}>
      <textarea
        class="absolute inset-0 py-2 pr-16 bg-transparent"
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

// this will render text value into an invisible pseudo element, which will
// then be used to calculate the height of the textarea
const autoGrow = css`
  &:after {
    visibility: hidden;
    content: attr(data-value) " ";
    white-space: pre-wrap;
    border: 1px solid transparent;
    max-height: 30vh;
    overflow-y: hidden;
  }
`
