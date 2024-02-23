import { useMemo } from "preact/hooks"
import { signal } from "@preact/signals"
import { AutoGrowTextarea, Button, Form, Field } from "../_components"
import { defaultPrompt } from "./ChatSession"

export const ChatPrompt = ({ chat, onSave }) => {
  const editing = useMemo(() => signal(false), [chat])

  return (
    <div class="container vstack gap-2" onDblClick={() => (editing.value = true)}>
      <label class="text-sm uppercase font-medium">System Prompt</label>
      {editing.value ? (
        <Form data={chat} onSubmit={data => (onSave(data), (editing.value = false))}>
          <Field as={AutoGrowTextarea} name="prompt" defaultValue={defaultPrompt} class="min-h-[4.5rem]" />

          <div class="mt-2 hstack gap-2">
            <Button submit>Save</Button>
            <Button text onClick={() => (editing.value = false)}>
              Cancel
            </Button>
          </div>
        </Form>
      ) : (
        <div class="text-neutral-9">{chat.prompt ?? defaultPrompt}</div>
      )}
    </div>
  )
}
