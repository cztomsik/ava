import { PanelRightClose, PanelRightOpen, SquarePen, Trash2, Undo } from "lucide"
import { AutoScroll, Field, Form, GenerationProgress, IconButton, Modal, Page } from "../_components"
import { defaultSampling, useQuery, useLocalStorage, selectedModel, useGenerate } from "../_hooks"
import { ChatPrompt } from "./ChatPrompt"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { SamplingOptions } from "../playground/SamplingOptions"
import { ChatOptions } from "./ChatOptions"
import { router } from "../router"
import { api } from "../api"
import { useSignal } from "@preact/signals"

export const ChatSession = ({ id }) => {
  const { data: chat = {} as any } = useQuery(id && api.getChat(id))
  const { data: messages = [] } = useQuery(id && api.listMessages(id))
  const sidebarOpen = useLocalStorage("chat.sidebar", false)
  const input = useLocalStorage(`chat.${id}.input`, "")

  // TODO: use /chat/completions
  const editing = useSignal(null)
  const generating = useSignal(null)
  const { generate, result, ...progress } = useGenerate()

  const handleSend = async () => {
    if (!id) {
      id = (await api.createChat({ ...chat, name: chat.name ?? `New chat ${new Date().toLocaleDateString()}` })).id
      router.navigate(`/chat/${id}`, true)
    }

    const content = input.value
    input.value = ""

    const msg = await api.createMessage(id, { role: "user", content })
    const tmp = await api.createMessage(id, { role: "assistant", content: "" })

    handleGenerate([...messages, msg], tmp)
  }

  const handleGenerate = async (history, msg, start_with = "") => {
    // const { choices } = await api.createCompletion({ model: selectedModel.value, messages: [...messages, msg] })
    // await api.updateMessage(id, tmp.id, choices[0].message)

    const prompt =
      (chat.prompt ?? defaultPrompt) +
      [...history, { ...msg, content: start_with }]
        .reduce((res, m) => res + `${m.role.toUpperCase()}: ${m.content}\n`, "")
        .trimEnd()

    editing.value = null
    generating.value = msg.id

    await api.updateMessage(id, msg.id, {
      ...msg,
      content: await generate({
        prompt,
        start_with,
        trim_first: !!start_with.match(/(^|\s)$/),
        sampling: {
          ...chat.sampling,
          stop: [`USER:`, `ASSISTANT:`],
        },
      }),
    })

    generating.value = null
  }

  const handleRename = async () => {
    const name = await Modal.prompt("Name this chat", chat.name)
    await api.updateChat(id, { ...chat, name })
  }

  const handleUpdate = async data => {
    Object.assign(chat, data)
    if (id) await api.updateChat(id, data)
  }

  const handleDelete = () =>
    Modal.confirm("Are you sure you want to delete this chat?")
      .then(() => api.deleteChat(id))
      .then(() => router.navigate("/chat", true))

  const handleUndo = async () => {
    const chunk = messages.splice(messages.findLastIndex(m => m.role === "user"))
    input.value = chunk[0].content

    await Promise.all(chunk.map(m => api.deleteMessage(id, m.id)))
  }

  return (
    <>
      <Page.Header title={chat?.name ?? "Chat"}>
        {id && (
          <>
            <IconButton title="Rename" icon={SquarePen} onClick={handleRename} />
            <IconButton title="Undo" icon={Undo} onClick={handleUndo} />
            <IconButton title="Delete" icon={Trash2} onClick={handleDelete} />
          </>
        )}

        <IconButton
          title="Toggle sidebar"
          icon={sidebarOpen.value ? PanelRightClose : PanelRightOpen}
          onClick={() => (sidebarOpen.value = !sidebarOpen.value)}
        />
      </Page.Header>

      <Page.Content class="!p-0 [&_.container]:(px-4 py-6 w-full max-w-3xl mx-auto)">
        <ChatPrompt chat={chat} onSave={handleUpdate} />

        {(!id || messages.length === 0) && <NoMessages />}

        {messages.map((m, i) => (
          <ChatMessage
            key={m.id}
            message={m.id === generating.value ? { ...m, content: result } : m}
            isEditing={editing.value === m}
            onEdit={() => (editing.value = m)}
            onGenerate={s => handleGenerate(messages.slice(0, i), m, s)}
            onSave={data => api.updateMessage(id, m.id, data)}
            onCancel={() => (editing.value = null)}
            onDelete={() => api.deleteMessage(id, m.id)}
          />
        ))}

        <GenerationProgress class="container mb-10 justify-start" {...progress} />
        <AutoScroll />
      </Page.Content>

      <Page.Footer class="pt-2">
        <ChatInput value={input} onChange={v => (input.value = v)} onSend={handleSend} />
      </Page.Footer>

      {sidebarOpen.value && (
        <Page.DetailsPane sizes={[200, 250, 400]}>
          <Form data={chat} onChange={handleUpdate} onSubmit={handleUpdate}>
            <Field as={ChatOptions} name="options" defaultValue={{ user: "USER", assistant: "ASSISTANT" }} />
            <Field as={SamplingOptions} name="sampling" defaultValue={defaultSampling} />
          </Form>
        </Page.DetailsPane>
      )}
    </>
  )
}

const NoMessages = () => (
  <div class="text-sky-12 bg-sky-2 px-4 py-2 border(y-1 sky-6)">
    <div class="container">
      <strong>The conversation is empty.</strong>
      <ul class="list-disc mt-2 ml-4">
        <li>Select model in the bottom left corner.</li>
        <li>Use the input below to start chatting.</li>
        <li>
          Use the list on the left to load a previous chat.
          <br />
          (hidden if the window size is too small)
        </li>
        <li>You can type multi-line messages with Shift+Enter.</li>
        <li>
          Double click on a message to edit it, or for <strong>partial completion</strong>.
        </li>
        <li>You can also change the system-prompt at the top by double clicking it.</li>
      </ul>
    </div>
  </div>
)

export const defaultPrompt =
  "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n"
