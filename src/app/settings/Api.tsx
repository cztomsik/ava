import { Alert, Markdown } from "../_components"
import { API_URL } from "../api"
import { SettingsPage } from "./SettingsPage"

export const Api = () => {
  return (
    <SettingsPage>
      <Alert class="mb-8">
        <strong>This feature is experimental.</strong> <br />
        The API is not yet stable and may change in the future.
      </Alert>

      <Markdown
        input={`
# API

The API is a simple HTTP endpoint at \`${API_URL}\`. It accepts \`GET\`, \`POST\`, \`PUT\` and \`DELETE\` requests with a JSON body and returns either a JSON or a stream of JSON lines.

Please consult the [API source code](https://github.com/cztomsik/ava/tree/main/src/api) for more details.
`}
      />
    </SettingsPage>
  )
}
