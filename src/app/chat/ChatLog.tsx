import { Markdown } from "../_components"

// TODO: load from settings
const userImg = URL.createObjectURL(
  new Blob(
    [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
        <rect x="0" y="0" width="32" height="32" fill="#eee" />
        <text x="16" y="22" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#ccc">?</text>
      </svg>`,
    ],
    { type: "image/svg+xml" }
  )
)

export const ChatLog = ({ chat }) => {
  return (
    <div class="vstack">
      {messages.map(message => (
        <Message {...message} />
      ))}
    </div>
  )
}

// TODO: onEdit, onDelete
export const Message = ({ role, content }) => {
  return role == "system" ? (
    <div class="text-md lg:text-lg text-neutral-400 mb-4">{content}</div>
  ) : (
    <div class={`hstack py-2 md:py-4 lg:py-6 odd:(border(y neutral-100) bg-neutral-50 -mx-10 px-10)`}>
      <Avatar class="mr-4" role={role} />
      <Markdown class="flex-1" input={"" + content} />
    </div>
  )
}

export const Avatar = ({ role, class: className = "" }) => {
  const src = role === "user" ? userImg : "/favicon.ico"

  return <img class={`w-6 h-6 md:(w-8 h-8) lg:(w-10 h-10) rounded self-start ${className}`} alt={role} src={src} />
}

const messages = [
  {
    role: "system",
    content:
      "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n",
  } as any,

  {
    role: "user",
    content: "Hello, I'm a curious user. What is your name?",
  },

  {
    role: "assistant",
    content: "My name is LLaMA. I'm an artificial intelligence assistant.",
  },

  {
    role: "user",
    content: `I need you to add jsdoc to this code:
  \`\`\`
  function add(a, b) {
    return a + b
  }
  \`\`\`
  `,
  },

  {
    role: "assistant",
    content: `Sure, I can do that. Here is the code with jsdoc:
  \`\`\`
  /**
   * Adds two numbers.
   * @param {number} a The first number.
   * @param {number} b The second number.
   * @returns {number} The sum of the two numbers.
   */
  function add(a, b) {
    return a + b
  }
  \`\`\`
  `,
  },

  {
    role: "user",
    content: "That's great!",
  },

  {
    role: "assistant",
    content: "I'm glad you like it.",
  },

  {
    role: "user",
    content: "What is the meaning of life?",
  },

  {
    role: "assistant",
    content: "The meaning of life is to be happy.",
  },
]
