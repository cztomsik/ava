import { useMemo } from "preact/hooks"
import { Button, Form, IconButton } from "../_components"
import { useConfirm } from "../_hooks"
import { signal } from "@preact/signals"
import { useChatContext } from "./useChat"
import { RotateCcw, StepForward, Trash2 } from "lucide"

export const EditMessage = ({ message: m }) => {
  const chat = useChatContext()

  const content = useMemo(() => signal(m.content), [m.content])

  const handleDelete = useConfirm("Are you sure you want to delete this message?", () => chat.deleteMessage(m), [])

  return (
    <Form class="flex-1 vstack gap-2" onSubmit={() => chat.updateMessage({ ...m, content: content.value })}>
      <textarea value={content} onInput={e => (content.value = e.target!.value)} rows={5} autofocus />

      <div class="hstack gap-2">
        <Button submit>Save</Button>
        <Button onClick={chat.cancelEdit} text>
          Cancel
        </Button>

        <IconButton
          title="Continue"
          class="ml-auto"
          icon={StepForward}
          onClick={() => chat.generateMessage(m, content.value)}
        />
        <IconButton title="Regenerate" icon={RotateCcw} onClick={() => chat.generateMessage(m)} />
        <IconButton title="Delete" class="ml-6" icon={Trash2} onClick={handleDelete} />
      </div>
    </Form>
  )
}
