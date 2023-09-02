import { Button, PageContent, PageHeader } from "../_components"
import { ChatLog } from "./ChatLog"
import { ChatInput } from "./ChatInput"
import { useGenerate } from "../_hooks"
import { signal, useSignal } from "@preact/signals"
import { useRef } from "preact/hooks"

export const Chat = () => {
  const { generate, loading, abort } = useGenerate()
  const messages = useSignal([
    {
      role: "system",
      content:
        "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n",
    } as any,
  ])

  const ref = useRef(null)

  const handleSend = async text => {
    const content = signal("")

    messages.value = [...messages.value, { role: "user", content: text }, { role: "assistant", content }]

    const prompt = messages.value.reduce(
      (res, m) => res + (m.role === "system" ? m.content : `${m.role.toUpperCase()}: ${m.content}\n`),
      ""
    )

    // TODO: use /tokenize because every model has its own tokenizer and this might work just by accident
    for await (const temp of generate(prompt.trimEnd(), { stop: ["USER", ":"] })) {
      content.value = temp

      ref.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <PageHeader title="Chat" description="Dialog-based interface" />

      <PageContent>
        <ChatLog chat={{ messages }} />

        <div ref={ref} class="hstack justify-center mt-4">
          {loading && <Button onClick={abort}>Stop generation</Button>}
        </div>
      </PageContent>

      {/* Always visible, because we are always either in a previous chat or in a new chat. */}
      <footer class="p-4 lg:px-10">
        <ChatInput onSend={handleSend} />
      </footer>
    </>
  )
}
