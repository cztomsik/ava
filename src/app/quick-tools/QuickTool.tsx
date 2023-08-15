import { Button, Form } from "../_components"

export const QuickTool = ({ spec }) => {
  const VAR = /\{\{(\w+)\}\}/g
  const variableNames = spec.prompt.match(VAR)?.map(v => v.slice(2, -2)) ?? []

  const result = ""

  return (
    <>
      <header>
        <h2>{spec.title}</h2>

        <p class="text-secondary">{spec.description}</p>
      </header>

      <main class="row">
        <div class="col">
          <Form class="card p-4" onSubmit={() => alert("TODO")}>
            {variableNames.map((name, i) => (
              <div class="form-floating mb-3" key={name}>
                <input type="text" class="form-control" />
                <label>{name.toUpperCase()}</label>
              </div>
            ))}

            <Button type="submit" primary>
              Generate
            </Button>
          </Form>
        </div>

        <div class="col">
          <pre class="card p-3">{result}</pre>
        </div>
      </main>
    </>
  )
}
