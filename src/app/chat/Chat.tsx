import { AutoScroll, GenerationProgress, List, Page, Select } from "../_components"
import { ChatLog } from "./ChatLog"
import { ChatInput } from "./ChatInput"
import { useApi, getApiContext, useGenerate, useConfirm, useResize, useLocalStorage } from "../_hooks"
import { router } from "../router"
import { useCallback, useEffect } from "preact/hooks"
import { useSignal } from "@preact/signals"

export const Chat = ({ params: { id } }) => {
  const { post: createChat, del } = useApi("chat")
  let { data: chat, put: updateChat } = useApi(id && `chat/${id}`)
  let { data: messages = [], loading, post: pushMessage } = useApi(id && `chat/${id}/messages`)
  const { generate, result, ...progress } = useGenerate()
  const draft = useSignal(null)

  const handleSend = async text => {
    if (!id) {
      id = (await createChat({ name: `New chat ${new Date().toLocaleDateString()}` })).id
      pushMessage = getApiContext(`chat/${id}/messages`).post
      router.navigate(`/chat/${id}`, true)
    }

    const msg = { role: "user", content: text }
    await pushMessage(msg)
    draft.value = { role: "assistant", content: result }

    // TODO: use /tokenize because every model has its own tokenizer and this might work just by accident
    await generate(serializePrompt([...messages, msg, draft.value]), { stop: ["USER", ":"] })
    await pushMessage(draft.value)
    draft.value = null
  }

  useEffect(() => {
    // if (messages.length === 2) {
    //   generate(serializePrompt(messages) + "\n\nSummary:", {
    //     maxTokens: 64,
    //     stop: ["USER", ":"],
    //   }).then(summary => {
    //     if (summary) {
    //       updateChat({ name: summary[0].toUpperCase() + summary.slice(1).replace(/[\.\n].*/, "") })
    //     }
    //   })
    // }
  }, [messages])

  const handleSelect = id => {
    router.navigate(`/chat/${id}`)
  }

  const handleDelete = useConfirm(
    "Are you sure you want to delete this chat?",
    async id => {
      await del(id)
      router.navigate("/chat", true)
    },
    []
  )

  const focusInput = useCallback((e: KeyboardEvent) => {
    if (!e.altKey && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
      const input = e.currentTarget.parentElement.querySelector("textarea")!
      e.preventDefault()
      input.focus()
      input.value += e.key
    }
  }, [])

  return (
    <Page>
      <Page.Header title={chat?.name ?? "Chat"} onKeyPress={focusInput}>
        {id && (
          <a class="py-1.5 text-red-11" onClick={() => handleDelete(id)}>
            Delete
          </a>
        )}
        <ChatSelect value={id} onSelect={handleSelect} />
      </Page.Header>

      <ChatList class="hidden md:flex" value={id} onSelect={handleSelect} onKeyPress={focusInput} />

      <Page.Content onKeyPress={focusInput}>
        <div class="text(neutral-9 lg:lg) mt-3 mb-6 whitespace-pre-wrap">{defaultPrompt}</div>

        {!loading && messages.length === 0 && (
          <div class="text-sky-12 bg-sky-1 -mx-6 p-6 px-8 border(y-1 sky-6)">
            <strong>The conversation is empty.</strong>
            <ul class="list-disc mt-2 ml-4">
              <li>Select model in the bottom left corner.</li>
              <li>Use the input below to start chatting.</li>
              <li>Use the dropdown above to load a previous chat.</li>
              <li>You can type multi-line messages with Shift+Enter.</li>
            </ul>
          </div>
        )}

        <ChatLog messages={messages} draft={progress.data.value && draft.value} />
        <GenerationProgress class="mt-4" {...progress} />
        <AutoScroll />
      </Page.Content>

      <Page.Footer class="pt-2">
        <ChatInput id={id} onSend={handleSend} />
      </Page.Footer>
    </Page>
  )
}

const ChatList = ({ class: className = "", value, onSelect, ...props }) => {
  const width = useLocalStorage("chat.list.width", 200)
  const { style, resizeHandle } = useResize({ width, minWidth: 200, maxWidth: 600 })

  const { data } = useApi("chat")

  return (
    <nav class={`relative ${className}`} {...props}>
      <List style={style}>
        <List.Item active={!value} onFocus={() => onSelect("")}>
          <List.Item.Title>New chat</List.Item.Title>
          <List.Item.Subtitle>Start a new chat with a model.</List.Item.Subtitle>
        </List.Item>

        {data?.map(({ id, name, last_message }) => (
          <List.Item key={id} active={value === "" + id} onFocus={() => onSelect(id)}>
            <List.Item.Title>{name}</List.Item.Title>
            <List.Item.Subtitle>{last_message}</List.Item.Subtitle>
          </List.Item>
        ))}

        {resizeHandle}
      </List>
    </nav>
  )
}

const ChatSelect = ({ value, onSelect }) => {
  const { data } = useApi("chat")

  return (
    <Select class="max-w-[200px]" value={value} onChange={e => onSelect(e.target.value)}>
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
