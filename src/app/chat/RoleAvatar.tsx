export const RoleAvatar = ({ role, class: className = "" }) => {
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
