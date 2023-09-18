import { useSignal } from "@preact/signals"
import { Alert, Button, Link, Modal, Table } from "../_components"
import { SettingsPage } from "./SettingsPage"

const urls = [
  "https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGUF/resolve/main/wizardlm-13b-v1.2.Q4_K_M.gguf",
  "https://huggingface.co/TheBloke/Airoboros-L2-7B-2.2-GGUF/resolve/main/airoboros-l2-7b-2.2.Q4_K_M.gguf",
  "https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF/resolve/main/codellama-7b-instruct.Q6_K.gguf",
  "https://huggingface.co/NikolayKozloff/falcon-7b-GGUF/resolve/main/falcon-7b-Q4_0-GGUF.gguf",
  "https://huggingface.co/Aryanne/Mamba-gpt-3B-v4-ggml-and-gguf/resolve/main/q4_0-gguf-mamba-gpt-3B_v4.gguf",
  "https://huggingface.co/juanjgit/orca_mini_3B-GGUF/resolve/main/orca-mini-3b.q4_0.gguf",
  "https://huggingface.co/klosax/tinyllamas-stories-gguf/resolve/main/tinyllamas-stories-15m-f32.gguf",
]

export const Models = () => {
  const progress = useSignal(null)

  const download = (url: string) => {
    progress.value = { url, percent: 0 }

    window["reportProgress"] = percent => {
      progress.value = percent === 100 ? null : { url, percent }
    }

    webkit.messageHandlers.event.postMessage(`download ${url}`)
  }

  const cancel = () => {
    progress.value = null
    webkit.messageHandlers.event.postMessage(`cancel`)
  }

  return (
    <SettingsPage>
      {progress.value && <ProgressModal {...progress.value} onCancel={cancel} />}

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
                <Button onClick={() => download(url)}>Download</Button>
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

const ProgressModal = ({ url, percent, onCancel }) => {
  const basename = url.split("/").pop()

  return (
    <Modal class="w-[30rem]" title={`Download in Progress`} onClose={onCancel}>
      <div class="flex justify-between">
        <span>Downloading {basename}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>

      <div class="mt-4 h-1 w-full bg-neutral-200 dark:bg-neutral-600">
        <div class="h-1 bg-blue-400" style={`width: ${percent}%`}></div>
      </div>
    </Modal>
  )
}
