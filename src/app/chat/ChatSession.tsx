import { PanelRightClose, PanelRightOpen, PenSquare, Trash2, Undo } from "lucide"
import { useCallback, useReducer } from "preact/hooks"
import { AutoScroll, GenerationProgress, IconButton, Page } from "../_components"
import { useConfirm } from "../_hooks"
import { router } from "../router"
import { ChatContext, useChat } from "./useChat"
import { ChatPrompt } from "./ChatPrompt"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { SamplingOptions } from "../playground/SamplingOptions"

export const ChatSession = ({ id }) => {
  const chat = useChat(id)
  const [showSidebar, toggleSidebar] = useReducer(s => !s, false)

  const handleRename = useCallback(async () => {
    const name = window.prompt("Name this chat", chat.data?.name ?? "Untitled")

    if (name) {
      await chat.updateChat({ ...chat.data, name })
    }
  }, [chat])

  const handleDelete = useConfirm("Are you sure you want to delete this chat?", async id => {
    await chat.deleteChat()
    router.navigate("/chat", true)
  })

  return (
    <ChatContext.Provider value={chat}>
      <Page.Header title={chat.data?.name ?? "Chat"}>
        {id && (
          <>
            <IconButton title="Rename" icon={PenSquare} onClick={handleRename} />
            <IconButton title="Undo" icon={Undo} onClick={chat.undo} />
            <IconButton title="Delete" icon={Trash2} onClick={handleDelete} />
          </>
        )}

        <IconButton title="Toggle sidebar" icon={showSidebar ? PanelRightClose : PanelRightOpen} onClick={toggleSidebar} />
      </Page.Header>

      <Page.Content class="!p-0 [&_.container]:(px-4 py-6 w-full max-w-3xl mx-auto)">
        <ChatPrompt />

        {(!id || chat.messages?.length === 0) && <NoMessages />}

        {chat.messages?.map(m => (
          <ChatMessage key={m.id} message={m} />
        ))}

        <GenerationProgress class="container mb-10 justify-start" {...chat.progress} />
        <AutoScroll />
      </Page.Content>

      <Page.Footer class="pt-2">
        <ChatInput value={chat.input} onChange={e => (chat.input.value = e.target!.value)} onSend={chat.send} />
      </Page.Footer>

      {showSidebar && (
        <Page.DetailsPane sizes={[200, 250, 400]}>
          <SamplingOptions data={chat.sampling} onChange={v => (chat.sampling = v)} />
        </Page.DetailsPane>
      )}
    </ChatContext.Provider>
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
