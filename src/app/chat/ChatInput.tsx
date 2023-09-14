import { useSignal } from "@preact/signals"
import { Button, Form } from "../_components"

export const ChatInput = ({ onSend }) => {
  const text = useSignal("")

  const handleSubmit = e => {
    onSend(text.value.trim())
    text.value = ""
  }

  return (
    <Form class="flex relative shadow" onSubmit={handleSubmit}>
      <textarea
        class="w-full py-2 pr-10 bg-transparent"
        rows={Math.min(6, text.value.split("\n").length)}
        placeholder="Ask anything..."
        value={text.value}
        onInput={e => (text.value = e.target.value)}
        onKeyUp={e => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
      ></textarea>
      <Button class="absolute top-1 right-1" submit>
        Send
      </Button>
    </Form>
  )
}
