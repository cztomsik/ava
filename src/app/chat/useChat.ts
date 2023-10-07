import { createContext } from "preact"
import { useContext, useMemo } from "preact/hooks"
import { useApi, useGenerate, useLocalStorage } from "../_hooks"
import { signal } from "@preact/signals"

export const ChatContext = createContext<ReturnType<typeof useChat>>(null as any)

export const useChatContext = () => useContext(ChatContext)

export const useChat = id => {
  const chat = useApi(id && `chat/${id}`)
  const messages = useApi(id && `chat/${id}/messages`)
  const input = useLocalStorage(`chat.${id}.input`, "")
  const { generate, result, ...progress } = useGenerate()

  const ctx = useMemo(() => {
    const editing = signal<any>(null)
    const generating = signal<any>(null)

    return {
      input,
      result,

      get data() {
        return chat.data
      },

      get system_prompt() {
        return chat.data?.system_prompt ?? defaultPrompt
      },

      get messages() {
        return messages.data
      },

      get editing() {
        return editing.value
      },

      get generating() {
        return generating.value
      },

      async updateChat(data) {
        await chat.put({ ...chat.data, ...data })
      },

      async deleteChat() {
        await chat.del()
      },

      async send() {
        const content = input.value
        input.value = ""

        if (!id) {
          alert("TODO")
          return
        }

        await messages.post({ role: "user", content })
        await messages.post({ role: "assistant", content: "" })

        await ctx.generateMessage(messages.data![messages.data!.length - 1])
      },

      async undo() {
        if (messages.data && messages.data.length > 0) {
          const lastIndex = messages.data.findLastIndex(m => m.role === "user") ?? 0
          input.value = messages.data[lastIndex].content

          const toDelete = messages.data.slice(lastIndex)
          messages.data = messages.data.slice(0, lastIndex)

          await Promise.all(toDelete.map(m => ctx.deleteMessage(m)))
        }
      },

      editMessage(message: any) {
        editing.value ??= message
      },

      cancelEdit() {
        editing.value = null
      },

      async generateMessage(message: any, startWith = "") {
        try {
          const index = messages.data!.indexOf(message)
          const prompt =
            ctx.system_prompt + serializePrompt([...messages.data!.slice(0, index), { ...message, content: startWith }])

          generating.value = message
          editing.value = null

          await generate(prompt, { startWith, trimFirst: !!startWith.match(/\s$/), stop: ["USER:", "ASSISTANT:"] })
          await ctx.updateMessage({ ...message, content: result.value })
        } finally {
          generating.value = null
        }
      },

      async updateMessage(message: any) {
        await messages.putAt(message.id, message)
        editing.value = null
      },

      async deleteMessage(message: any) {
        await messages.del(message.id)
        editing.value = null
      },
    }
  }, [id])

  return ctx
}

const defaultPrompt =
  "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n"
const serializePrompt = messages =>
  messages.reduce((res, m) => res + `${m.role.toUpperCase()}: ${m.content}\n`, "").trimEnd()
