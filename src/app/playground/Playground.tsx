import { useSignal } from "@preact/signals"
import { Play, Save, Trash2 } from "lucide"
import { AutoScroll, Checkbox, Form, GenerationProgress, IconButton, Markdown, Page, Resizable } from "../_components"
import { PromptSelect } from "./PromptSelect"
import { useApi, useConfirm, useGenerate, useLocalStorage, GenerateOptions, defaultSampling } from "../_hooks"
import { parseVars, template } from "../_util"
import { SamplingOptions } from "./SamplingOptions"
import { Variables } from "./Variables"

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { post: createPrompt, del } = useApi("prompts")
  const selection = useSignal<any>(null)

  const prompt = useLocalStorage("playground.prompt", "")
  const variableNames = parseVars(prompt.value)
  const data = useSignal({})

  const { generate, result, ...progress } = useGenerate([prompt.value])
  const showPrompt = useSignal(false)

  const sampleOptions = useLocalStorage<GenerateOptions["sampling"]>("playground.sampleOptions", defaultSampling)

  const handleSubmit = () => generate({ prompt: template(prompt.value, data.value), sampling: sampleOptions.value })

  const handleSaveAs = async () => {
    const name = window.prompt("Name this prompt", selection.value?.name ?? "Untitled")

    if (name) {
      selection.value = await createPrompt({ name, prompt: prompt.value })
    }
  }

  const handleDelete = useConfirm("Are you sure you want to delete this prompt?", async () => {
    const { id } = selection.value
    selection.value = null
    prompt.value = ""
    await del(id)
  })

  return (
    <Page>
      <Page.Header title="Playground">
        {selection.value?.id > 0 && <IconButton icon={Trash2} onClick={handleDelete} />}
        <IconButton title="Generate" icon={Play} onClick={handleSubmit} disabled={prompt.value === ""} />
        <IconButton title="Save As" icon={Save} onClick={handleSaveAs} />
      </Page.Header>

      <Page.Content class="!p-0">
        <Form class="flex-1 flex max-h-full" onSubmit={handleSubmit}>
          <div class="flex-1 vstack p-3">
            <PromptSelect
              value={selection.value}
              onChange={item => {
                prompt.value = item.prompt
                selection.value = item
              }}
            />

            <textarea
              class="flex-1"
              placeholder="Type your prompt here..."
              rows={16}
              value={prompt}
              onInput={e => {
                prompt.value = e.target!.value
                selection.value = null
              }}
            ></textarea>
          </div>

          <Resizable rtl sizes={[300, 400, 800]} class="border(l neutral-6) p-3 vstack overflow-x-hidden overflow-y-auto">
            <h3 class="mb-2 text-neutral-10 text-sm uppercase font-medium">Result</h3>

            <div class="flex mb-2">
              <Checkbox label="Show Prompt" value={showPrompt} onChange={v => (showPrompt.value = v)} />
            </div>

            <div class="flex-1 overflow-auto">
              <Markdown
                input={showPrompt.value ? template(prompt.value, data.value) + result.value : result.value}
                class="p-4 mb-2 border(1 neutral-6) rounded-md empty:hidden"
              />
              <GenerationProgress {...progress} />
              <AutoScroll />
            </div>
          </Resizable>
        </Form>
      </Page.Content>

      <Page.DetailsPane sizes={[200, 250, 450]}>
        <Variables variableNames={variableNames} data={data.value} onChange={v => (data.value = v)} />

        <SamplingOptions data={sampleOptions.value} onChange={v => (sampleOptions.value = v)} />
      </Page.DetailsPane>
    </Page>
  )
}
