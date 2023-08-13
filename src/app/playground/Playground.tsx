import { useSignal } from "@preact/signals"
import { Form } from "../_components"
import { useGenerate } from "../_hooks"

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
      <header>
        <h2 class="mb-2">Playground</h2>
      </header>

      {/* TODO: single-area mode + toggle */}
      <main>
        <Form onSubmit={handleSubmit}>
          <div class="row mb-2">
            <div class="col">
              <select class="form-select mb-2">
                <option selected>Text</option>
              </select>

              <textarea
                class="form-control"
                placeholder="Prompt"
                rows={14}
                value={prompt}
                onInput={e => (prompt.value = e.target.value)}
              ></textarea>
            </div>
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

              <textarea class="form-control" placeholder="Result" readOnly rows={10} value={result}></textarea>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-primary">
              Generate
            </button>

            {loading && (
              <button type="button" class="btn btn-outline-danger" onClick={abort}>
                Stop generation
              </button>
            )}
          </div>
        </Form>
      </main>
    </>
  )
}