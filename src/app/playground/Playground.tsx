import { useSignal } from "@preact/signals"
import { AutoScroll, Button, Form, GenerationProgress, Markdown, PageContent, PageHeader, Select } from "../_components"
import { useApi, useGenerate } from "../_hooks"
import { examples } from "../quick-tools/_examples"
import { useLocalStorage } from "../_hooks"

const VAR = /\{\{(\w+)\}\}/g

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { post: createPrompt, del } = useApi("prompts")
  const { generate, result, ...progress } = useGenerate()
  const prompt = useLocalStorage("playground.prompt", "")
  const selection = useSignal(null)
  const variables = useSignal({})

  const variableNames = prompt.value.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const handleSubmit = async () => {
    for await (const res of generate(prompt.value.replace(VAR, (_, name) => variables[name]))) {
    }
  }

  const handleSaveAs = async () => {
    const name = window.prompt("Name this prompt", selection.value?.name ?? "Untitled")

    if (name) {
      selection.value = await createPrompt({ name, prompt: prompt.value })
    }
  }

  const handleDelete = async () => {
    const { id } = selection.value
    selection.value = null
    prompt.value = ""
    await del(id)
  }

  return (
    <>
      <PageHeader title="Playground">
        {selection.value?.id > 0 && <Button onClick={handleDelete}>Delete</Button>}
        <Button onClick={handleSaveAs}>Save As</Button>
        {EXP && <Button>Create a Tool</Button>}
      </PageHeader>

      <PageContent>
        <Form class="flex-1 max-h-full row" onSubmit={handleSubmit}>
          <div class="col vstack">
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
                prompt.value = e.target.value
                selection.value = null
              }}
            ></textarea>

            <Button class="mt-2" submit>
              Generate
            </Button>
          </div>

          <div class="col vstack">
            {variableNames.map(name => (
              <div class="flex mb-2">
                <div class="p-[5px] px-3 bg-neutral-2 border(1 neutral-8 r-0) rounded-l-md">{name}</div>
                <input
                  type="text"
                  class="w-full rounded-none rounded-r-md"
                  value={variables[name]}
                  onInput={e => (variables[name] = e.target.value)}
                />
              </div>
            ))}

            <div class="flex-1 overflow-auto">
              <Markdown input={result.value} class="p-4 mb-2 border(1 neutral-6) rounded-md empty:hidden" />
              <GenerationProgress {...progress} />
              <AutoScroll />
            </div>
          </div>
        </Form>
      </PageContent>
    </>
  )
}

const PromptSelect = ({ value, onChange }) => {
  const { data, loading } = useApi("prompts")

  const handleChange = e => {
    const id = +e.target.value
    const arr = id > 0 ? data : examples

    onChange(arr.find(p => p.id === id))
  }

  return (
    <Select class="mb-2" value={value?.id ?? ""} onChange={handleChange}>
      <option value="">Load from ...</option>

      <optgroup label="Saved Prompts">
        {loading && <option>Loading ...</option>}

        {data?.map(({ id, name }) => (
          <option value={id}>{name}</option>
        ))}
      </optgroup>

      <optgroup label="Examples">
        {examples.map(({ id, name }, i) => (
          <option value={id}>{name}</option>
        ))}
      </optgroup>
    </Select>
  )
}
