import { Markdown } from "../_components"

export const ChatLog = ({ chat, class: className = "", fallbackContent = null }) => {
  const items = chat.messages.value

  return (
    <div class={`vstack ${className}`}>
      {items.map(message => (
        <Message {...message} />
      ))}

      {items.length === 1 && fallbackContent}
    </div>
  )
}

// TODO: onEdit, onDelete
export const Message = ({ role, content }) => {
  return role == "system" ? (
    <div class="text(neutral-400 lg:lg) mb-4">{content}</div>
  ) : (
    <div class={`hstack py-2 md:py-4 lg:py-6 odd:(border(y neutral-200) bg-neutral-50 -mx-10 px-10)`}>
      <Avatar class="mr-4" role={role} />
      <Markdown class="flex-1" input={"" + content} />
    </div>
  )
}

export const Avatar = ({ role, class: className = "" }) => {
  const src = role === "user" ? userImg : assistantImg

  return <img class={`w-6 h-6 md:(w-8 h-8) lg:(w-10 h-10) rounded self-start ${className}`} alt={role} src={src} />
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
