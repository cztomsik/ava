import { useSignal } from "@preact/signals"
import { Button, Form, Markdown, PageContent, PageHeader } from "../_components"
import { useApi, useGenerate } from "../_hooks"
import { examples } from "../quick-tools/_examples"
import { useLocalStorage } from "../_hooks"

const VAR = /\{\{(\w+)\}\}/g

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { generate, loading, abort } = useGenerate()
  const prompt = useLocalStorage("playground.prompt", "")
  const variables = useSignal({})
  const result = useSignal("")

  const variableNames = prompt.value.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const handleSubmit = async () => {
    result.value = ""

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
        <Form class="flex-1 row overflow-hidden" onSubmit={handleSubmit}>
          <div class="col vstack">
            <PromptLoader onLoad={item => (prompt.value = item.prompt)} />

            <textarea
              class="form-control flex-1"
              placeholder="Type your prompt here..."
              rows={16}
              value={prompt}
              onInput={e => (prompt.value = e.target.value)}
            ></textarea>

            <div class="hstack gap-2 mt-2">
              <Button submit>Generate</Button>

              {loading && <Button onClick={abort}>Stop generation</Button>}
            </div>
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
              <Markdown input={result.value} class="card p-3" />
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
