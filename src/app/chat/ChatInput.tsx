import { Button, Form } from "../_components"

export const ChatInput = ({ onSubmit }) => {
  return (
    <Form onSubmit={onSubmit}>
      <textarea
        autofocus
        class="form-control mb-2"
        rows={3}
        placeholder="Ask anything..."
        // value={text.value}
        // onInput={e => (text.value = e.target.value)}
        // onKeyUp={e => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
      ></textarea>
      <div class="hstack gap-2">
        <Button submit>Send</Button>
        {/* {loading && <Button onClick={abort}>Stop generation</Button>} */}
      </div>
    </Form>
  )
}
