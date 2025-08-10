import { RotateCcw, StepForward, Trash2 } from "lucide"
import { AutoGrowTextarea, Button, Form, Field, IconButton, Markdown, Modal } from "../_components"
import { RoleAvatar } from "./RoleAvatar"

export const ChatMessage = ({ message, isEditing, onEdit, onGenerate, onSave, onCancel, onDelete }) => (
  <div class={`odd:border-y odd:border-neutral-6 odd:bg-neutral-2`} onDblClick={onEdit}>
    <div class="container flex relative">
      <RoleAvatar class="mr-3" role={message.role} />
      {isEditing ? (
        <Form class="flex-1 vstack gap-2" data={message} onChange={data => (message = data)} onSubmit={onSave}>
          <Field name="content" as={AutoGrowTextarea} class="min-h-[4.5rem]" />

          <div class="hstack gap-2">
            <Button submit>Save</Button>
            <Button onClick={onCancel} text>
              Cancel
            </Button>

            <IconButton title="Continue" class="ml-auto" icon={StepForward} onClick={() => onGenerate(message.content)} />
            <IconButton title="Regenerate" icon={RotateCcw} onClick={() => onGenerate()} />
            <IconButton
              title="Delete"
              class="ml-6"
              icon={Trash2}
              onClick={() => Modal.confirm("Are you sure you want to delete this message?").then(onDelete)}
            />
          </div>
        </Form>
      ) : (
        <Markdown class="flex-1 self-center" input={message.content} />
      )}
    </div>
  </div>
)
