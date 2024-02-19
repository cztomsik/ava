import { useSignal } from "@preact/signals"
import { Play, Save, Trash2 } from "lucide"
import { AutoScroll, Checkbox, Form, Field, GenerationProgress, IconButton, Markdown, Page, Resizable } from "../_components"
import { Modal } from "../_components"
import { useGenerate, useLocalStorage, defaultSampling, getApiContext } from "../_hooks"
import { parseVars, template } from "../_util"
import { PromptSelect } from "./PromptSelect"
import { SamplingOptions } from "./SamplingOptions"
import { Variables } from "./Variables"

const { post: createPrompt, del: deletePrompt } = getApiContext("prompts")

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
  const { generate, result, ...progress } = useGenerate([state.prompt])

  const selection = useSignal<any>(null)

  const handleSubmit = ({ prompt, data, sampling }) => generate({ prompt: template(prompt, data), sampling })

  const handleSaveAs = async () => {
    selection.value = await createPrompt({
      name: await Modal.prompt("Name this prompt", "Untitled"),
      prompt: state.prompt,
    })
  }

  const handleDelete = () =>
    Modal.confirm("Are you sure you want to delete this prompt?")
      .then(() => deletePrompt(selection.value.id))
      .then(() => {
        selection.value = null
        signal.value = EMPTY
      })

  return (
    <Form data={state} onChange={v => ((signal.value = v), (selection.value = null))} onSubmit={handleSubmit}>
      <Page>
        <Page.Header title="Playground">
          {selection.value?.id > 0 && <IconButton icon={Trash2} onClick={handleDelete} />}
          <IconButton title="Generate" icon={Play} submit disabled={state.prompt === ""} />
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
                <Markdown
                  input={state.showPrompt ? template(state.prompt, state.data) + result.value : result.value}
                  class="p-4 mb-2 border(1 neutral-6) rounded-md empty:hidden"
                />
                <GenerationProgress {...progress} />
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
