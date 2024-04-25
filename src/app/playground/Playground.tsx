import { useMemo } from "preact/hooks"
import { computed, useSignal } from "@preact/signals"
import { Play, Save, Trash2 } from "lucide"
import { AutoScroll, Checkbox, Form, Field, IconButton, Markdown, Page, Resizable } from "../_components"
import { Modal } from "../_components"
import { useGenerate, useLocalStorage, defaultSampling } from "../_hooks"
import { parseVars, template } from "../_util"
import { PromptSelect } from "./PromptSelect"
import { SamplingOptions } from "./SamplingOptions"
import { Variables } from "./Variables"
import { api } from "../api"

const EMPTY = {
  prompt: "",
  data: {},
  showPrompt: false,
  sampling: defaultSampling,
}

// TODO: json, grammar, json-schema
export const Playground = () => {
  const signal = useLocalStorage("playground.state", EMPTY)
  const state = signal.value
  const { generate, result, status, abort } = useGenerate([state.prompt])

  // changing prompt will create new signal for result, so we need useMemo()
  const res = useMemo(() => {
    return computed(() =>
      signal.value.showPrompt ? template(signal.value.prompt, signal.value.data) + result.value : result.value
    )
  }, [result])

  const selection = useSignal<any>(null)

  const handleSubmit = ({ prompt, data, sampling }) => generate({ prompt: template(prompt, data), sampling })

  const handleSaveAs = async () => {
    selection.value = await api.createPrompt({
      name: await Modal.prompt("Name this prompt", "Untitled"),
      prompt: state.prompt,
    })
  }

  const handleDelete = () =>
    Modal.confirm("Are you sure you want to delete this prompt?")
      .then(() => api.deletePrompt(selection.value.id))
      .then(() => ((selection.value = null), (signal.value = EMPTY)))

  return (
    <Form data={state} onChange={v => ((signal.value = v), (selection.value = null))} onSubmit={handleSubmit}>
      <Page>
        <Page.Header title="Playground">
          {selection.value?.id > 0 && <IconButton icon={Trash2} onClick={handleDelete} />}
          <IconButton title="Generate" icon={Play} disabled={state.prompt === ""} abort={abort} submit />
          <IconButton title="Save As" icon={Save} onClick={handleSaveAs} />
        </Page.Header>

        <Page.Content class="!p-0">
          <div class="flex-1 flex max-h-full">
            <div class="flex-1 vstack p-3">
              <PromptSelect
                value={selection.value}
                onChange={item => {
                  signal.value = { ...EMPTY, prompt: item.prompt }
                  selection.value = item
                }}
              />

              <Field as="textarea" name="prompt" class="flex-1" placeholder="Type your prompt here..." rows={16} />
            </div>

            <Resizable rtl sizes={[300, 400, 800]} class="border(l neutral-6) p-3 vstack overflow-x-hidden overflow-y-auto">
              <h3 class="mb-2 text-neutral-10 text-sm uppercase font-medium">Result</h3>

              <div class="flex mb-2">
                <Field as={Checkbox} name="showPrompt" label="Show Prompt" />
              </div>

              <div class="flex-1 overflow-auto">
                <Markdown class="p-4 mb-2 border(1 neutral-6) rounded-md empty:hidden" input={status || res} />
                <AutoScroll />
              </div>
            </Resizable>
          </div>
        </Page.Content>

        <Page.DetailsPane sizes={[200, 250, 450]}>
          <Field as={Variables} name="data" variableNames={parseVars(state.prompt)} />

          <Field as={SamplingOptions} name="sampling" />
        </Page.DetailsPane>
      </Page>
    </Form>
  )
}
