import { useSignal } from "@preact/signals"
import { Button, Form, GenerationProgress, Markdown, PageContent, PageHeader } from "../_components"
import { useApi, useGenerate } from "../_hooks"
import { examples } from "../quick-tools/_examples"
import { useLocalStorage } from "../_hooks"

const VAR = /\{\{(\w+)\}\}/g

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { generate, ...progress } = useGenerate()
  const prompt = useLocalStorage("playground.prompt", "")
  const variables = useSignal({})
  const result = useSignal("")

  const variableNames = prompt.value.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const handleSubmit = async () => {
    for await (const res of generate(prompt.value.replace(VAR, (_, name) => variables[name]))) {
      result.value = res
    }
  }

  return (
    <>
      <PageHeader title="Playground" description="Try out new ideas quickly">
        {DEV && <Button>Create a Tool</Button>}
      </PageHeader>

      <PageContent>
        <Form class="flex-1 max-h-full row" onSubmit={handleSubmit}>
          <div class="col vstack">
            <PromptLoader onLoad={item => (prompt.value = item.prompt)} />

            <textarea
              class="form-control flex-1"
              placeholder="Type your prompt here..."
              rows={16}
              value={prompt}
              onInput={e => (prompt.value = e.target.value)}
            ></textarea>

            <Button class="mt-2" submit>
              Generate
            </Button>
          </div>

          {/* TODO: this whole part should be a separate component, keyed by prompt or variable names */}
          <div class="col vstack">
            {variableNames.map(name => (
              <input
                type="text"
                class="form-control mb-2"
                placeholder={name}
                value={variables[name]}
                onInput={e => (variables[name] = e.target.value)}
              />
            ))}

            <div class="flex-1 overflow-auto">
              <Markdown input={result.value} class="p-4 mb-2 border rounded-md empty:hidden" />
              <GenerationProgress {...progress} />
            </div>
          </div>
        </Form>
      </PageContent>
    </>
  )
}

const PromptLoader = ({ onLoad }) => {
  const { data: savedPrompts, loading } = useApi("prompts")

  const handleChange = e => {
    const id = e.target.value

    if (id > 0) {
      return onLoad(savedPrompts.find(p => p.id == id))
    }

    if (id <= 0) {
      return onLoad(examples[-id])
    }
  }

  return (
    <select class="form-select mb-2" onChange={handleChange}>
      <option selected value="">
        Load from ...
      </option>

      {DEV && (
        <optgroup label="Saved">
          {loading && <option>Loading ...</option>}

          {savedPrompts?.map(({ id, name }) => (
            <option value={id}>{name}</option>
          ))}
        </optgroup>
      )}

      <optgroup label="Examples">
        {examples.map(({ name }, i) => (
          <option value={-i}>{name}</option>
        ))}
      </optgroup>
    </select>
  )
}
