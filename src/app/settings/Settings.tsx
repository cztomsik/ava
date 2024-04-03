import { Form, Field, Alert, Button } from "../_components"
import { useQuery } from "../_hooks"
import { api } from "../api"
import { SettingsPage } from "./SettingsPage"

export const Settings = () => {
  const { data: system = {} } = useQuery(api.getSystemInfo())
  const { data } = useQuery(api.getConfig())

  const handleSubmit = data => api.updateConfig(data)

  return (
    <SettingsPage>
      <Alert class="mb-8">
        <strong>This feature is in development.</strong> <br />
        Validation and error handling are not yet implemented. Please be careful when changing settings.
      </Alert>

      <Form class="vstack" data={data} onChange={handleSubmit} onSubmit={handleSubmit}>
        <Row
          title="App Home"
          description={
            <>
              Path to the app home directory. This can only be changed via <code>AVA_HOME</code> environment variable.
            </>
          }
        >
          <input class="w-96" value={system.app_home} disabled />
        </Row>

        <Row
          title="Model Download Path"
          description={
            <>
              Path to the directory where models are downloaded. The path must be either absolute, or relative to the app
              home directory.
            </>
          }
        >
          <Field class="w-96" name="download.path" />
        </Row>

        <Row
          title="Server Port"
          description="Port number to use for the local server. The app must be restarted for the change to take effect."
        >
          <Field class="w-20" name="server.port" type="number" />
        </Row>

        <Row title="Context Length" description="Number of tokens to use as context for the model.">
          <Field class="w-20" name="llama.n_ctx" type="number" min={1} />
        </Row>

        <Row
          title="CPU threads count"
          description="Number of threads to use during generation. If empty, the app will use the number of performance cores available on the system."
        >
          <Field class="w-16" name="llama.n_threads" type="number" min={1} />
        </Row>

        {/* <Row title="CPU threads count (prompt)" description="Number of threads to use during prompt processing. Some CPUs may benefit from a higher value.">
          <Field class="w-16" name="llama.n_threads_batch" type="number" min={1} />
        </Row> */}

        <Row
          title="Batch size"
          description="Number of tokens processed simultaneously during initial prompt load. Higher values can subtly improve performance, but may result in less frequent progress updates, potentially giving the impression of the app being unresponsive."
        >
          <Field class="w-20" name="llama.n_batch" type="number" min={1} />
        </Row>

        {/* <Row
          title="Factory reset"
          description="Reset all settings to their default values and delete all data. This action cannot be undone."
        >
          <Button disabled>Reset</Button>
        </Row> */}
      </Form>
    </SettingsPage>
  )
}

const Row = ({ title, description, children }) => (
  <div class="flex flex-wrap items-start p-4 border(b neutral-4) last:border-b-none">
    <div class="vstack flex-1 pr-8 mr-auto">
      <h3 class="font-semibold mb-2">{title}</h3>
      <p class="text-sm text-neutral-11">{description}</p>
    </div>

    {children}
  </div>
)
