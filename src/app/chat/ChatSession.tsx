import { signal, useSignal } from "@preact/signals"
import { useGenerate } from "../_hooks"
import { Button, Form } from "../_components"
import { ChatMessage } from "./ChatMessage"

export const ChatSession = () => {
  const { generate, loading, abort } = useGenerate()
  const text = useSignal("")
  const messages = useSignal([
    {
      role: "system",
      content:
        "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n",
    } as any,
  ])

  const handleSubmit = async e => {
    const content = signal("")

    messages.value = [...messages.value, { role: "user", content: text.value.trim() }, { role: "assistant", content }]

    const prompt = messages.value.reduce(
      (res, m) => res + (m.role === "system" ? m.content : `${m.role.toUpperCase()}: ${m.content}\n`),
      ""
    )
    text.value = ""

    for await (const temp of generate(prompt.trimEnd())) {
      content.value = temp
    }
  }

  return (
    <>
      <header>
        <h2 class="mb-4">New Chat</h2>
      </header>

      <div>
        {messages.value.map(m => (
          <ChatMessage {...m} />
        ))}
      </div>

      <footer class="pt-2 print:hidden">
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

            {loading && <Button onClick={abort}>Stop generation</Button>}
          </div>
        </Form>
      </footer>
    </>
  )
}
