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
    <Form class="relative max-w-2xl mx-auto" onSubmit={onSend}>
      <AutoGrowTextarea
        class="text-lg px-3 py-3 pr-16 bg-transparent"
        rows={1}
        placeholder="Ask anything..."
        value={value}
        onInput={onChange}
        onKeyDown={handleKeyDown}
      />
      <IconButton title="Send" icon={SendHorizontal} class="absolute h-full top-0 right-2" submit />
    </Form>
  )
}
