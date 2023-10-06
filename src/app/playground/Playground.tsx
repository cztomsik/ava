import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { Play, Save, Trash2 } from "lucide"
import { AutoScroll, Button, Checkbox, Form, GenerationProgress, IconButton, Markdown, Page, Select } from "../_components"
import { useApi, useConfirm, useGenerate, useLocalStorage } from "../_hooks"
import { dedent, parseVars, template } from "../_util"

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { post: createPrompt, del } = useApi("prompts")
  const { generate, result, ...progress } = useGenerate()
  const prompt = useLocalStorage("playground.prompt", "")
  const showPrompt = useSignal(false)
  const data = useSignal({})
  const selection = useSignal<any>(null)

  const variableNames = parseVars(prompt.value)

  // Auto-clear result whenever the prompt changes
  useEffect(() => prompt.subscribe(() => (result.value = "")), [])

  const handleSubmit = () => generate(template(prompt.value, data.value))

  const handleSaveAs = async () => {
    const name = window.prompt("Name this prompt", selection.value?.name ?? "Untitled")

    if (name) {
      selection.value = await createPrompt({ name, prompt: prompt.value })
    }
  }

  const handleDelete = useConfirm(
    "Are you sure you want to delete this prompt?",
    async () => {
      const { id } = selection.value
      selection.value = null
      prompt.value = ""
      await del(id)
    },
    []
  )

  return (
    <Page>
      <Page.Header title="Playground">
        {selection.value?.id > 0 && <IconButton icon={Trash2} onClick={handleDelete} />}
        <IconButton title="Generate" icon={Play} onClick={handleSubmit} />
        <IconButton title="Save As" icon={Save} onClick={handleSaveAs} />
        {NEXT && <Button>Create a Tool</Button>}
      </Page.Header>

      <Page.Content>
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
                prompt.value = e.target!.value
                selection.value = null
              }}
            ></textarea>
          </div>

          <div class="col vstack">
            {variableNames.map(name => (
              <div class="flex mb-2">
                <div class="p-[5px] px-3 bg-neutral-2 border(1 neutral-8 r-0) rounded-l-md">{name}</div>
                <input
                  type="text"
                  class="w-full !rounded-none !rounded-r-md"
                  value={data.value[name]}
                  onInput={e => (data.value = { ...data.value, [name]: e.target!.value })}
                />
              </div>
            ))}

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
          </div>
        </Form>
      </Page.Content>
    </Page>
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

const examples = [
  {
    id: -1,
    name: "Story Writing",
    prompt: dedent`
      The following is an excerpt from a story about Bob, the cat, flying to space.
    `,
  },

  {
    id: -2,
    name: "Top 10 Movies To Watch",
    prompt: dedent`
      The top 10 movies to watch in 2025 are:
    `,
  },

  {
    id: -3,
    name: "Question Answering",
    prompt: dedent`
      Q: What is the capital of France?
      A: Paris.
      Q: {{question}}
      A:
    `,
  },

  // TODO: Writing technical documentation, product announcement, etc.
  {
    id: -4,
    name: "Copywriting",
    prompt: dedent`
      User needs help with copywriting.

      ASSISTANT: Hello.
      USER: Write a blog post{{#subject}} about {{subject}}{{/subject}}.
      ASSISTANT: Ok, here is a draft of the post.
    `,
  },
]
