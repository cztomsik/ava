import { GenerationProgress, PageContent, PageFooter, PageHeader, Select } from "../_components"
import { ChatLog } from "./ChatLog"
import { ChatInput } from "./ChatInput"
import { useApi, getApiContext, useGenerate } from "../_hooks"
import { router } from "../router"

export const Chat = ({ params: { id } }) => {
  const { post: createChat } = useApi("chat")
  let { data: messages = [], loading, post: pushMessage } = useApi(id && `chat/${id}/messages`)
  const { generate, result, ...progress } = useGenerate()
  const draft = { role: "assistant", content: result }

  const handleSend = async text => {
    if (!id) {
      id = (await createChat({ name: `New chat ${new Date().toLocaleDateString()}` })).id
      pushMessage = getApiContext(`chat/${id}/messages`).post
      router.navigate(`/chat/${id}`, true)
    }

    const msg = { role: "user", content: text }
    await pushMessage(msg)

    // TODO: use /tokenize because every model has its own tokenizer and this might work just by accident
    for await (const x of generate(serializePrompt([...messages, msg, draft]), { stop: ["USER", ":"] })) {
    }

    await pushMessage(draft)
    draft.content.value = ""
  }

  return (
    <>
      <PageHeader title="Chat">
        <ChatSelect value={id} />
      </PageHeader>
      <PageContent>
        <div class="text(neutral-9 lg:lg) mt-3 mb-6">{defaultPrompt}</div>

        {!loading && messages.length === 0 && (
          <div class="text-sky-11 bg-sky-1 -mx-6 p-6 px-8 border(y-1 sky-6)">
            <strong>The conversation is empty.</strong>
            <ul class="list-disc mt-2 ml-4">
              <li>Select model in the bottom left corner.</li>
              <li>Use the input below to start chatting.</li>
              <li>Use the dropdown above to load a previous chat.</li>
              <li>You can type multi-line messages with Shift+Enter.</li>
            </ul>
          </div>
        )}

        <ChatLog messages={messages} draft={progress.data.value && draft} />
        <GenerationProgress class="mt-4" {...progress} />
      </PageContent>
      <PageFooter class="pt-2">
        <ChatInput onSend={handleSend} />
      </PageFooter>
    </>
  )
}

const ChatSelect = ({ value }) => {
  const { data } = useApi("chat")

  return (
    <Select value={value} onChange={e => router.navigate(`/chat/${e.target.value}`)}>
      <option value="">Previous chats...</option>
      {data?.map(({ id, name }) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </Select>
  )
}

const defaultPrompt =
  "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n"

const serializePrompt = messages =>
  defaultPrompt + messages.reduce((res, m) => res + `${m.role.toUpperCase()}: ${m.content}\n`, "").trimEnd()
