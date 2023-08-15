import { useSignal } from "@preact/signals"
import { Button, Form, Markdown, PageContent, PageHeader } from "../_components"
import { useGenerate } from "../_hooks"
import { examples } from "../quick-tools/examples"

const VAR = /\{\{(\w+)\}\}/g

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { generate, loading, abort } = useGenerate()
  const prompt = useSignal(
    "Here's an e-mail to a customer named {{name}} about a product called {{product}}. The customer is asking about {{subject}} of the product."
  )
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
      <PageHeader title="Playground" description="Prototype new ideas quickly.">
        <Button class="ms-auto">Create a Tool</Button>
      </PageHeader>

      {/* TODO: single-area mode + toggle */}
      <PageContent>
        <Form class="vstack" onSubmit={handleSubmit}>
          <div class="row">
            <div class="col">
              <select class="form-select mb-2" onChange={e => (prompt.value = examples[e.target.value].prompt)}>
                <option selected class="text-secondary">
                  Load from ...
                </option>

                <optgroup label="Examples">
                  {examples.map(({ title }, i) => (
                    <option value={i}>{title}</option>
                  ))}
                </optgroup>
              </select>

              <textarea
                class="form-control"
                placeholder="Prompt"
                rows={16}
                value={prompt}
                onInput={e => (prompt.value = e.target.value)}
              ></textarea>

              <div class="d-flex gap-2 mt-2">
                <Button submit>Generate</Button>

                {loading && <Button onClick={abort}>Stop generation</Button>}
              </div>
            </div>

            {/* TODO: this whole part should be a separate component, keyed by prompt or variable names */}
            <div class="col">
              {variableNames.map(name => (
                <div class="input-group mb-2">
                  <span class="input-group-text">{name}</span>
                  <input
                    type="text"
                    class="form-control"
                    placeholder={name}
                    value={variables[name]}
                    onInput={e => (variables[name] = e.target.value)}
                  />
                </div>
              ))}

              {result.value && <Markdown input={result.value} class="card p-3" />}
            </div>
          </div>
        </Form>
      </PageContent>
    </>
  )
}
