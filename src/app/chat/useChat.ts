import { createContext } from "preact"
import { useContext, useMemo } from "preact/hooks"
import { signal, useSignal } from "@preact/signals"
import { defaultSampling, getApiContext, useApi, useGenerate, useLocalStorage } from "../_hooks"
import { router } from "../router"

export const ChatContext = createContext<ReturnType<typeof useChat>>(null as any)

export const useChatContext = () => useContext(ChatContext)

export const useChat = id => {
  // These are intentionally out of the useMemo
  let chat = useApi(id && `chat/${id}`)
  let messages = useApi(id && `chat/${id}/messages`)
  const input = useLocalStorage(`chat.${id}.input`, "")
  const { generate, result, ...progress } = useGenerate()
  const generating = useSignal<any>(null)

  const ctx = useMemo(() => {
    const editing = signal<any>(null)

    return {
      // TODO: chat & sampling options should be saved per-chat
      options: { user: "USER", assistant: "ASSISTANT" },
      sampling: defaultSampling,

      input,
      result,
      progress,

      get loading() {
        return id && (chat.loading || messages.loading)
      },

      get data() {
        return chat.data
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
        return id ? chat.put(data) : (chat.data = data)
      },

      async deleteChat() {
        await chat.del()
      },

      async send() {
        const content = input.value
        input.value = ""

        if (!id) {
          const { id } = await getApiContext("chat").post({
            name: chat.data?.name ?? `New chat ${new Date().toLocaleDateString()}`,
            prompt: chat.data?.prompt ?? null,
          })

          // This will trigger a re-render, so everything below will happen in
          // the "background" but it should still work, because we share the
          // `generating` signal and the underlying api contexts.
          router.navigate(`/chat/${id}`, true)
          messages = getApiContext(`chat/${id}/messages`)
        }

        await messages.post({ role: "user", content })
        await messages.post({ role: "assistant", content: "..." })

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

      async generateMessage(message: any, start_with = "") {
        try {
          const index = messages.data!.indexOf(message)
          const prompt = ctx.serializePrompt([...messages.data!.slice(0, index), { ...message, content: start_with }])

          generating.value = message
          editing.value = null

          await generate({
            prompt,
            start_with,
            trim_first: !!start_with.match(/(^|\s)$/),
            sampling: { ...ctx.sampling, stop: this.stop },
          })
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

      get stop() {
        return [`${this.options.user}:`, `${this.options.assistant}:`]
      },

      serializePrompt(messages: any[]) {
        return (
          (chat.data?.prompt ?? defaultPrompt) +
          messages.reduce((res, m) => res + `${this.options[m.role]}: ${m.content}\n`, "").trimEnd()
        )
      },
    }
  }, [id])

  return ctx
}

export const defaultPrompt =
  "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n"
