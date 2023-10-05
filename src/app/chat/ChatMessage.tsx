import { useEffect } from "preact/hooks"
import { useSignal } from "@preact/signals"
import { Button, Form, Markdown } from "../_components"
import { useApi, useConfirm } from "../_hooks"

export const ChatMessage = ({ id, chat_id, role, content }) => {
  const isEditing = useSignal(false)

  return (
    <div class={`hstack px-4 py-6 odd:(border(y neutral-6) bg-neutral-1)`} onDblClick={() => (isEditing.value = true)}>
      <Avatar class="mr-3 mt-0.5" role={role} />
      {isEditing.value ? (
        <EditMessage id={id} chat_id={chat_id} onClose={() => (isEditing.value = false)} />
      ) : (
        <Markdown class="flex-1" input={"" + content} />
      )}
    </div>
  )
}

const EditMessage = ({ id, chat_id, onClose }) => {
  const { data, put, del } = useApi(`chat/${chat_id}/messages/${id}`)

  const content = useSignal("")
  // TODO: useForm() or something
  useEffect(() => {
    if (data) {
      content.value = data.content
    }
  }, [data])

  const handleSubmit = async () => {
    await put({ ...data, content: content.value })
    onClose()
  }

  const handleDelete = useConfirm("Are you sure you want to delete this message?", () => del(), [])

  return (
    <Form class="flex-1 vstack gap-2" onSubmit={handleSubmit}>
      <textarea value={content} onInput={e => (content.value = e.target.value)} rows={5} autofocus />

      <div class="hstack gap-2">
        <Button submit>Save</Button>
        <Button onClick={onClose}>Cancel</Button>

        <a class="ml-auto p-1.5 text-red-11" onClick={handleDelete}>
          Delete
        </a>
      </div>
    </Form>
  )
}

const Avatar = ({ role, class: className = "" }) => {
  const src = role === "user" ? userImg : assistantImg

  return <img class={`w-9 h-9 rounded self-start ${className}`} alt={role} src={src} />
}

const fallbackAvatar = (text, bg, fg) =>
  URL.createObjectURL(
    new Blob(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <rect x="0" y="0" width="32" height="32" fill="${bg}" />
        <text x="16" y="21" font-family="sans-serif" font-size="12" text-anchor="middle" fill="${fg}">${text}</text>
      </svg>`,
      ],
      { type: "image/svg+xml" }
    )
  )

// TODO: load from settings
const userImg = fallbackAvatar("You", "#dc354588", "#fff")
const assistantImg = fallbackAvatar("AVA", "#0d6efd", "#fff")
