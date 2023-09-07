import { signal, useSignal } from "@preact/signals"
import { GenerationProgress, PageContent, PageHeader } from "../_components"
import { ChatLog } from "./ChatLog"
import { ChatInput } from "./ChatInput"
import { useGenerate } from "../_hooks"

const defaultPrompt =
  "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n"

const serializePrompt = messages =>
  messages
    .reduce((res, m) => res + (m.role === "system" ? m.content : `${m.role.toUpperCase()}: ${m.content}\n`), "")
    .trimEnd()

export const Chat = () => {
  const { generate, ...progress } = useGenerate()
  const messages = useSignal([{ role: "system", content: defaultPrompt }])

  const handleSend = async text => {
    const content = signal("")
    messages.value = [...messages.value, { role: "user", content: text }, { role: "assistant", content }]

    // TODO: use /tokenize because every model has its own tokenizer and this might work just by accident
    for await (const temp of generate(serializePrompt(messages.value), { stop: ["USER", ":"] })) {
      content.value = temp
    }
  }

  return (
    <>
      <PageHeader title="Chat" />

      <PageContent>
        <ChatLog
          chat={{ messages }}
          fallbackContent={
            <div class="text-neutral-400">
              <div>They conversation is empty.</div>
              <ul class="list-disc mt-2 ml-4">
                <li>Use the input below to start chatting.</li>
                <li>You can type multi-line messages with Shift+Enter.</li>
              </ul>
            </div>
          }
        />
        <GenerationProgress class="mt-4" {...progress} />
      </PageContent>

      {/* Always visible, because we are always either in a previous chat or in a new chat. */}
      <footer class="p-4 pt-0 lg:px-10">
        <ChatInput onSend={handleSend} />
      </footer>
    </>
  )
}
