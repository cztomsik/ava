import { h } from "preact"
import { signal, useSignal } from "@preact/signals"
import { Markdown } from "./components"
import { useEffect } from "preact/hooks"

export const Chat = ({ index }) => {
  // TODO: optionally load session from local storage by index

  return (
    <div class="row">
      <div class="chats col-md-3">
        <div class="group">
          <div>Today</div>
          <ul class="list-unstyled">
            <li>
              <a class="active" href="#">
                Poem about JavaScript
              </a>
            </li>
            <li>
              <a href="#">Invoke Clang from Zig</a>
            </li>
          </ul>
        </div>

        <div class="group">
          <div>Yesterday</div>
          <ul class="list-unstyled">
            <li>
              <a href="#">Trip to Italy</a>
            </li>
            <li>
              <a href="#">Recipe for a cake</a>
            </li>
          </ul>
        </div>

        <div class="group">
          <div>Previous 7 days</div>
          <ul class="list-unstyled">
            <li>
              <a href="#">How to make a website</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="chat col-md-9">
        <ChatSession />
      </div>
    </div>
  )
}

const ChatSession = () => {
  const text = useSignal("")
  const messages = useSignal([
    {
      role: "system",
      content:
        "A chat between a curious user and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the user's questions.\n\n",
    } as any,
  ])
  const ctrl = useSignal(null)

  // cancel any generation when the component is unmounted
  useEffect(() => {
    return () => ctrl.value?.abort()
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    ctrl.value?.abort()

    const content = signal("")

    messages.value = [...messages.value, { role: "user", content: text.value.trim() }, { role: "assistant", content }]

    const prompt = messages.value.reduce(
      (res, m) => res + (m.role === "system" ? m.content : `${m.role.toUpperCase()}: ${m.content}\n`),
      ""
    )
    text.value = ""

    ctrl.value = new AbortController()

    try {
      for await (const temp of generate(prompt.trimEnd(), ctrl.value.signal)) {
        content.value = temp
      }
    } finally {
      ctrl.value = null
    }
  }

  return (
    <div class="d-flex flex-column">
      <h2 class="mb-4">New Chat</h2>

      {messages.value.map(m => (
        <ChatMessage {...m} />
      ))}

      <form onSubmit={handleSubmit}>
        <textarea
          class="form-control mb-2"
          rows={3}
          placeholder="Ask anything..."
          value={text.value}
          onInput={e => (text.value = e.target.value)}
          onKeyUp={e => e.key === "Enter" && !e.shiftKey && handleSubmit(e)}
        ></textarea>
        <button type="submit" class="btn btn-primary me-2">
          Send
        </button>
        {ctrl.value && (
          <button type="button" class="btn btn-outline-danger" onClick={() => ctrl.value.abort()}>
            Stop generation
          </button>
        )}
      </form>
    </div>
  )
}

const ChatMessage = ({ role, content }) => (
  <div class="message mb-4 role-${role}">
    <div class="role">{role}:</div>
    <div class="content">
      <Markdown input={"" + content} />
    </div>
  </div>
)

async function* generate(prompt, signal?: AbortSignal) {
  const response = await fetch("http://localhost:8080/completion", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      stream: true,
      n_predict: 1024,
      temperature: 0.7,
      repeat_last_n: 256,
      repeat_penalty: 1.18,
      top_k: 40,
      top_p: 0.5,
    }),
    headers: {
      Connection: "keep-alive",
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    signal,
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let content = ""

  for (let res = await reader.read(); !res.done; res = await reader.read()) {
    const data = JSON.parse(decoder.decode(res.value).replace(/^data:/, ""))

    // strip the space which is always emitted at the beginning of the stream
    if (!content) {
      data.content = data.content.trimStart()
    }

    yield (content += data.content)
  }
}
