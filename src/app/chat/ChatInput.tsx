import { useSignal } from "@preact/signals"
import { Button, Form } from "../_components"

export const ChatInput = ({ onSend }) => {
  const text = useSignal("")

  const handleSubmit = e => {
    onSend(text.value.trim())
    text.value = ""
  }

  return (
    <Form onSubmit={handleSubmit}>
      <textarea
        autofocus
        class="form-control mb-2"
        rows={3}
        placeholder="Ask anything..."
        value={text.value}
        onInput={e => (text.value = e.target.value)}
        onKeyUp={e => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
      ></textarea>
      <div class="hstack gap-2">
        <Button submit>Send</Button>
      </div>
    </Form>
  )
}
