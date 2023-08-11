import { useSignal } from "@preact/signals"
import { Form } from "../_components"
import { useGenerate } from "../_hooks"

// TODO: json, grammar, json-schema
export const Playground = () => {
  const { generate, loading, abort } = useGenerate()
  const prompt = useSignal("The capital of France is")
  const result = useSignal("")

  const handleSubmit = async () => {
    result.value = ""

    for await (const res of generate(prompt.value)) {
      result.value = res
    }
  }

  return (
    <div>
      <div class="d-flex mb-2">
        <h2>Playground</h2>

        {/* <div class="d-flex gap-2 ms-auto">
          <select class="form-select"></select>
          <button class="btn btn-primary">New</button>
          <button class="btn btn-primary">Save</button>
        </div> */}
      </div>

      {/* TODO: single-area mode + toggle */}
      <Form onSubmit={handleSubmit}>
        <div class="row mb-2">
          <div class="col">
            <textarea
              class="form-control"
              placeholder="Prompt"
              rows={14}
              value={prompt}
              onInput={e => (prompt.value = e.target.value)}
            ></textarea>
          </div>
          <div class="col">
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
    </div>
  )
}
