import { css } from "@twind/core"
import { Alert, Markdown } from "../_components"
import { API_URL } from "../_hooks"
import { SettingsPage } from "./SettingsPage"

const styles = css`
  & pre {
    @apply overflow-auto;
  }
`

export const Api = () => {
  return (
    <SettingsPage>
      <Alert class="mb-8">
        <strong>This feature is experimental.</strong> <br />
        The API is not yet stable and may change in the future.
      </Alert>

      <Markdown
        class={styles}
        input={`
# API

The API is a simple HTTP endpoint at \`${API_URL}\`. It accepts \`GET\` and \`POST\` requests with a JSON body and returns either a JSON or a stream of JSON lines.

## GET /api/models

Returns a list of available models.

\`\`\`json
[
  {
    "id": 123,
    "name": "model_name",
    "path": "path/to/model",
  }
]
\`\`\`

## POST /api/generate

Generates text from a prompt.

\`\`\`json
{
  "model_id": 123,
  "prompt": "prompt text",
  "sampling": {
    "top_k": 40,
    "top_p": 0.5,
    "temperature": 0.7,
    "repeat_n_last": 256,
    "repeat_penalty": 1.05,
    "stop_eos": true
  }
}
\`\`\`

| Field               | Type        | Description |
| ------------------- | ----------- | ----------- |
| \`model_id\`        | \`number\`  | The id of the model to use. See the Models section for the list of available models. |
| \`prompt\`          | \`string\`  | The text to generate from. |
| \`sampling\`        | \`object\`  | The sampling parameters. |
| \`.top_k\`          | \`number\`  | The number of tokens to consider for each step. |
| \`.top_p\`          | \`number\`  | The cumulative probability threshold. |
| \`.temperature\`    | \`number\`  | How much to randomize the next token. |
| \`.repeat_n_last\`  | \`number\`  | The number of tokens to consider for the repetition penalty. |
| \`.repeat_penalty\` | \`number\`  | The repetition penalty. |
| \`.stop_eos\`       | \`boolean\` | Stop generating when an end-of-sentence token is encountered. |

The response is a stream of JSON lines, where each line is either \`{ status: "message" }\`, \`{ content: "token" }\` or \`{ error: "message" }\`. The response will be chunked, so the client can start processing the response as soon as the first chunk is received.

## GET /api/prompts

Returns a list of saved prompts.

\`\`\`json
[
  {
    "id": 1,
    "name": "prompt_name",
    "prompt": "prompt text"
  }
]
\`\`\`

## POST /api/prompts

Saves a prompt.

\`\`\`json
{
  "name": "prompt_name",
  "prompt": "prompt text"
}
\`\`\`

| Field      | Type       | Description |
| ---------- | ---------- | ----------- |
| \`name\`   | \`string\` | The name of the prompt. |
| \`prompt\` | \`string\` | The text of the prompt. |

## DELETE /api/prompts/:id

Deletes a prompt.

`}
      />
    </SettingsPage>
  )
}
