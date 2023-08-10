import { signal, useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { css } from "goober"
import { Markdown } from "../components"

const styles = css`
  .message {
    & .role {
      text-transform: capitalize;
      font-weight: 600;
    }

    &.role-system {
      color: var(--bs-secondary);

      .role {
        display: none;
      }
    }

    &.role-user {
      border-left: 4px solid var(--bs-primary);
      padding-left: 1rem;
      margin-left: -1rem;

      .role {
        color: var(--bs-primary);
      }
    }

    & pre {
      background: var(--bs-gray-200);
      padding: 1rem;
      border: 1px solid var(--bs-border-color);
    }
  }
`

export const Chat = ({ id }) => {
  // TODO: load by id

  return (
    <div class={styles}>
      <div class="row">
        <div class="chats col-md-3 d-print-none">
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

      <form class="d-print-none" onSubmit={handleSubmit}>
        <textarea
          autofocus
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
  <div class={`message mb-4 role-${role}`}>
    <div class="role">{role}:</div>
    <div class="content">
      <Markdown input={"" + content} />
    </div>
  </div>
)

async function* generate(prompt, signal?: AbortSignal) {
  const response = await fetch("/api/completion", {
    method: "POST",
    body: JSON.stringify({ prompt }),
    headers: {
      Connection: "keep-alive",
      "Content-Type": "application/json",
    },
    signal,
  })

  let content = ""

  for await (let token of chunks(response.body.getReader())) {
    // strip the initial space which is always emitted at the beginning of the stream
    if (!content) {
      token = token.trimStart()
    }

    yield (content += token)
  }
}

async function* chunks(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()

  for (let res; !(res = await reader.read()).done; ) {
    yield decoder.decode(res.value)
  }
}
