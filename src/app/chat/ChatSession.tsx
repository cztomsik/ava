import { PenSquare, Trash2, Undo } from "lucide"
import { AutoScroll, IconButton, Page } from "../_components"
import { useConfirm } from "../_hooks"
import { router } from "../router"
import { ChatMessage } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import { NoMessages } from "./NoMessages"
import { ChatContext, useChat } from "./useChat"
import { useCallback } from "preact/hooks"

export const ChatSession = ({ id }) => {
  const chat = useChat(id)

  const handleRename = useCallback(async () => {
    const name = window.prompt("Name this chat", chat.data.name ?? "Untitled")

    if (name) {
      await chat.updateChat({ name })
    }
  }, [chat])

  const handleDelete = useConfirm(
    "Are you sure you want to delete this chat?",
    async id => {
      await chat.deleteChat()
      router.navigate("/chat", true)
    },
    []
  )

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
      </Page.Header>

      <Page.Content class="!p-0">
        <div class="p-6 text-neutral-9 whitespace-pre-wrap">{chat.data?.system_prompt}</div>

        {(!id || chat.messages?.length === 0) && <NoMessages />}

        {chat.messages?.map(m => (
          <ChatMessage key={m.id} message={m} />
        ))}

        <AutoScroll />
      </Page.Content>

      <Page.Footer class="pt-2">
        <ChatInput />
      </Page.Footer>
    </ChatContext.Provider>
  )
}
