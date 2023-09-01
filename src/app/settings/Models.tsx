import { Alert, Button, Link, Table } from "../_components"
import { SettingsPage } from "./SettingsPage"

const urls = [
  "https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGML/blob/main/wizardlm-13b-v1.2.ggmlv3.q4_0.bin",
  "https://huggingface.co/TheBloke/orca_mini_3B-GGML/blob/main/orca-mini-3b.ggmlv3.q4_0.bin",
  "https://huggingface.co/s3nh/mamba-gpt-3b-v3-GGML/blob/main/mamba-gpt-3b-v3.ggmlv3.q4_0.bin",
]

export const Models = () => {
  return (
    <SettingsPage>
      <Alert class="bg-orange-50 mb-4">
        <strong>This page is under construction.</strong> <br />
        For now, you need to download the models manually and put them into your Downloads folder. <br />
        <br />
        You can download one of the models below, or you can find more models on the Wiki page below. <br />
        <br />
        <Button href="https://www.reddit.com/r/LocalLLaMA/wiki/models/">Open LocallLama Reddit</Button>
      </Alert>

      <p class="my-4"></p>

      <Table class="max-w-5xl">
        <thead>
          <tr>
            <th>Model</th>
            <th>Uploader</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {urls.map(url => (
            <tr>
              <td>{url.split("/")[4]}</td>
              <td>{url.split("/")[3]}</td>
              <td>
                <Link href={url}>Download</Link>
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
