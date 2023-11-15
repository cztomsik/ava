import { useCallback } from "preact/hooks"
import { Markdown } from "../_components"
import { RoleAvatar } from "./RoleAvatar"
import { EditMessage } from "./EditMessage"
import { useChatContext } from "./useChat"

export const ChatMessage = ({ message: m }) => {
  const chat = useChatContext()

  const handleEdit = useCallback(() => chat.editMessage(m), [m])

  return (
    <div class={`odd:(border(y-1 neutral-6) bg-neutral-2)`} onDblClick={handleEdit}>
      <div class="flex">
        <RoleAvatar class="mr-3" role={m.role} />
        {chat.editing === m ? (
          <EditMessage message={m} />
        ) : (
          <Markdown class="flex-1 self-center" input={chat.generating === m ? "" + chat.result : m.content} />
        )}
      </div>
    </div>
  )
}
