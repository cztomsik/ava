import { useMemo } from "preact/hooks"
import { signal } from "@preact/signals"
import { Button, Form } from "../_components"
import { defaultPrompt, useChatContext } from "./useChat"

export const ChatPrompt = () => {
  const chat = useChatContext()
  const editing = useMemo(() => signal(false), [chat])

  return editing.value ? (
    <EditPrompt onClose={() => (editing.value = false)} />
  ) : (
    <div class="p-4 text-neutral-9" onDblClick={() => (editing.value = true)}>
      {chat.data?.prompt ?? defaultPrompt}
    </div>
  )
}

const EditPrompt = ({ onClose }) => {
  const chat = useChatContext()
  const prompt = useMemo(() => signal(chat.data?.prompt ?? defaultPrompt), [chat])

  const handleSubmit = () => {
    chat.updateChat({ ...chat.data, prompt: prompt.value === defaultPrompt ? null : prompt.value })
    onClose()
  }

  return (
    <Form class="m-4" onSubmit={handleSubmit}>
      <textarea class="w-full h-32" value={prompt} onInput={e => (prompt.value = e.target!.value)} />

      <div class="mt-2 hstack gap-2">
        <Button submit>Save</Button>
        <Button onClick={onClose} text>
          Cancel
        </Button>
      </div>
    </Form>
  )
}
