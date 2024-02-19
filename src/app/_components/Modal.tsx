import { useEffect, useMemo } from "preact/hooks"
import { signal } from "@preact/signals"
import { Button } from "./Button"
import { Form, Field } from "./Form"

const count = signal(0) // TODO: not all modals are opened with Modal.open() yet, so modals.value.length is not enough
const modals = signal([] as any)

/**
 * Simple modal component
 */
export const Modal = ({ title, class: className = "", children, onClose }) => {
  useEffect(() => {
    const prevActive = document.activeElement instanceof HTMLElement ? document.activeElement : null
    prevActive?.blur()
    count.value++

    const listener = e => e.key === "Escape" && onClose()
    addEventListener("keydown", listener)

    return () => {
      removeEventListener("keydown", listener)
      count.value--
      prevActive?.focus()
    }
  }, [])

  return (
    <div tabIndex={-1} aria-hidden="true" class="fixed inset-0 z-50 flex" data-drag-window>
      <div class="w-full flex items-start justify-center pointer-events-none p-10">
        <div class={`rounded-lg bg-neutral-1 text-neutral-12 shadow-lg pointer-events-auto ${className}`}>
          <div class="hstack px-4 pt-4">
            <h5 class="text-lg font-medium">{title}</h5>
            <button type="button" class="ml-auto" onClick={onClose}>
              {cross}
            </button>
          </div>
          <div class="p-4" onMouseDown={preventDrag}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

Modal.Container = () => (
  <div>
    {modals.value.map(({ Comp, props }) => (
      <Comp {...props} />
    ))}

    <ModalBackdrop show={count.value > 0} />
  </div>
)

Modal.open = async (Comp, props = {}) => {
  let modal
  try {
    await new Promise((resolve, reject) => {
      modals.value = [...modals.value, (modal = { Comp, props: { ...props, resolve, reject } })]
    })
  } finally {
    modals.value = modals.value.filter(m => m !== modal)
  }
}

Modal.confirm = message => Modal.open(ConfirmModal, { message })

Modal.prompt = (message, defaultValue) => Modal.open(PromptModal, { message, defaultValue })

const preventDrag = e => e.stopPropagation()

const cross = (
  <svg class="stroke-neutral-12" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="14" x2="14" y2="2" stroke-width="1" />
    <line x1="2" y1="2" x2="14" y2="14" stroke-width="1" />
  </svg>
)

/**
 * Animated backdrop with blur, this is just a visual effect, it doesn't prevent clicks or anything
 */
export const ModalBackdrop = ({ show }) => (
  <div
    class={`fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm transition-opacity ${
      show ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}
  ></div>
)

export const ConfirmModal = ({ message, resolve, reject }) => (
  <Modal title="Confirm" onClose={() => reject()}>
    {message}

    <div class="mt-6 flex gap-2 justify-end">
      <Button primary onClick={() => resolve()}>
        Ok
      </Button>

      <Button text onClick={() => reject()}>
        Cancel
      </Button>
    </div>
  </Modal>
)

export const PromptModal = ({ message, defaultValue = "", resolve, reject }) => {
  const data = useMemo(() => ({ value: defaultValue }), [defaultValue])

  return (
    <Form data={data} onSubmit={({ value }) => resolve(value)}>
      <Modal title="Prompt" onClose={() => reject()}>
        {message}

        <Field name="value" class="mt-4 w-full" />

        <div class="mt-6 flex gap-2 justify-end">
          <Button submit>Ok</Button>

          <Button text onClick={() => reject()}>
            Cancel
          </Button>
        </div>
      </Modal>
    </Form>
  )
}
