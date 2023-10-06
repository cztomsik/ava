import { useCallback } from "preact/hooks"
import { Markdown } from "../_components"
import { RoleAvatar } from "./RoleAvatar"
import { EditMessage } from "./EditMessage"
import { useChatContext } from "./useChat"

export const ChatMessage = ({ message: m }) => {
  const chat = useChatContext()

  const handleEdit = useCallback(() => chat.editMessage(m), [m])

  return (
    <div class={`flex px-4 py-6 odd:(border(y neutral-6) bg-neutral-1)`} onDblClick={handleEdit}>
      <RoleAvatar class="mr-3" role={m.role} />
      {chat.editing === m ? (
        <EditMessage message={m} />
      ) : (
        <Markdown class="flex-1 mt-2" input={chat.generating === m ? "" + chat.result : m.content} />
      )}
    </div>
  )
}
