import { useEffect } from "preact/hooks"
import { SendHorizontal } from "lucide"
import { AutoGrowTextarea, Form, IconButton } from "../_components"

export const ChatInput = ({ value, onChange, onSend }) => {
  // Steal focus if no input is focused and a key is pressed
  useEffect(() => {
    const listener = e => {
      if (!("value" in e.target) && !e.altKey && !e.metaKey && !e.ctrlKey && e.key.length === 1) {
        // TODO: useRef()
        // TODO: or maybe just use one global listener and always find closest textarea/input?
        const input = document.querySelector("footer textarea")!
        e.preventDefault()
        input.focus()
        input.value += e.key
      }
    }

    document.body.addEventListener("keypress", listener)
    return () => document.body.removeEventListener("keypress", listener)
  }, [])

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <Form class="relative max-w-2xl mx-auto" onSubmit={onSend}>
      <AutoGrowTextarea
        class="text-lg px-3 py-3 pr-16 bg-transparent"
        rows={1}
        placeholder="Ask anything..."
        value={value}
        onInput={onChange}
        onKeyDown={handleKeyDown}
      />
      <IconButton title="Send" icon={SendHorizontal} class="absolute bottom-[9px] right-2" submit />
    </Form>
  )
}
