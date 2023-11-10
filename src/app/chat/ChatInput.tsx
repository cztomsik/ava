import { SendHorizontal } from "lucide"
import { AutoGrowTextarea, Form, IconButton } from "../_components"

export const ChatInput = ({ value, onChange, onSend }) => {
  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <Form class="relative" onSubmit={onSend}>
      <AutoGrowTextarea
        class="py-2 pr-16 bg-transparent"
        rows={1}
        placeholder="Ask anything..."
        value={value}
        onInput={onChange}
        onKeyDown={handleKeyDown}
      />
      <IconButton title="Send" icon={SendHorizontal} class="absolute bottom-1 right-1" submit />
    </Form>
  )
}
