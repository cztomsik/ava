import { Alert, Button, Link, Table } from "../_components"
import { SettingsPage } from "./SettingsPage"

const urls = [
  "https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGUF/blob/main/wizardlm-13b-v1.2.Q4_K_M.gguf",
  "https://huggingface.co/TheBloke/Airoboros-L2-7B-2.2-GGUF/blob/main/airoboros-l2-7b-2.2.Q4_K_M.gguf",
  "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/blob/main/codellama-7b-instruct.Q6_K.gguf",
  "https://huggingface.co/NikolayKozloff/falcon-7b-GGUF/blob/main/falcon-7b-Q4_0-GGUF.gguf",
  "https://huggingface.co/Aryanne/Mamba-gpt-3B-v4-ggml-and-gguf/blob/main/q4_0-gguf-mamba-gpt-3B_v4.gguf",
  "https://huggingface.co/juanjgit/orca_mini_3B-GGUF/blob/main/orca-mini-3b.q4_0.gguf",
]

export const Models = () => {
  return (
    <SettingsPage>
      <Alert class="mb-8">
        <strong>This page is under construction.</strong> <br />
        For now, you need to download the models manually and put them into your Downloads folder. <br />
        <br />
        You can download one of the models below, or you can find more models on the Wiki page below. <br />
        <br />
        <Button href="https://www.reddit.com/r/LocalLLaMA/wiki/models/">Open LocallLama Reddit</Button>
      </Alert>

      <Table class="max-w-5xl">
        <thead>
          <tr>
            <th>Model</th>
            <th>Uploader</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {urls.map(url => (
            <tr>
              <td class="capitalize">
                {url
                  .split("/")[4]
                  .replace(/-(GGML|GGUF).*$/gi, "")
                  .replace(/[-_]/g, " ")}
              </td>
              <td>{url.split("/")[3]}</td>
              <td>
                <Button href={url}>Download</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <p class="mt-4">
        <strong>
          Different models may have different licenses. Always check the license of each model before using it.
        </strong>
      </p>
    </SettingsPage>
  )
}
