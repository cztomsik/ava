import { useSignal } from "@preact/signals"
import { Alert, Button, Link, Modal, Table } from "../_components"
import { SettingsPage } from "./SettingsPage"
import { useApi } from "../_hooks"

const urls = [
  "https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGUF/resolve/main/wizardlm-13b-v1.2.Q4_K_M.gguf",
  "https://huggingface.co/TheBloke/Airoboros-L2-7B-2.2-GGUF/resolve/main/airoboros-l2-7b-2.2.Q4_K_M.gguf",
  "https://huggingface.co/NikolayKozloff/falcon-7b-GGUF/resolve/main/falcon-7b-Q4_0-GGUF.gguf",
  "https://huggingface.co/Aryanne/Mamba-gpt-3B-v4-ggml-and-gguf/resolve/main/q4_0-gguf-mamba-gpt-3B_v4.gguf",
  "https://huggingface.co/klosax/tinyllamas-stories-gguf/resolve/main/tinyllamas-stories-15m-f32.gguf",
]

export const Models = () => {
  const { data: models = [], refetch, del } = useApi("models")
  const progress = useSignal(null)

  const download = (url: string) => {
    progress.value = { url, percent: 0 }

    window["reportProgress"] = percent => {
      if (percent === 100) {
        progress.value = null
        return refetch()
      }

      progress.value = { url, percent }
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

      <Alert>
        <strong>This page is under construction.</strong> <br />
        For now, the models are searched in and downloaded to your Downloads folder. <br />
        <br />
        You can download one of the models below, or you can find more models on the Wiki page below. <br />
        <br />
        <Button href="https://www.reddit.com/r/LocalLLaMA/wiki/models/">Open LocallLama Reddit</Button>
      </Alert>

      <h2 class="mt-10 mb-2 text-xl">Installed models</h2>
      <Table class="max-w-5xl">
        <thead>
          <tr>
            <th>Model</th>
            <th class="w-40"></th>
          </tr>
        </thead>
        <tbody>
          {!models.length && (
            <tr>
              <td colSpan={2}>No models installed. Download one from the catalog below.</td>
            </tr>
          )}

          {models.map(m => (
            <tr>
              <td class="capitalize">{humanize(m.name)}</td>
              <td>
                <Button onClick={() => del(m.name)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2 class="mt-10 mb-2 text-xl">Catalog</h2>
      <Table class="max-w-5xl">
        <thead>
          <tr>
            <th>Model</th>
            <th>Uploader</th>
            <th class="w-40"></th>
          </tr>
        </thead>
        <tbody>
          {urls.map(url => (
            <tr>
              <td class="capitalize">{humanize(basename(url.slice(0, -5)))}</td>
              <td>{url.split("/")[3]}</td>
              <td>
                {models.find(m => m.name === basename(url).slice(0, -5)) ? (
                  <strong class="ml-3 text-green-10">Installed</strong>
                ) : (
                  <Button onClick={() => download(url)}>Download</Button>
                )}
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
  return (
    <Modal class="w-[30rem]" title={`Download in Progress`} onClose={onCancel}>
      <div class="flex justify-between">
        <span>Downloading {basename(url)}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>

      <div class="mt-4 h-1 w-full bg-neutral-7">
        <div class="h-1 bg-blue-9" style={`width: ${percent}%`}></div>
      </div>
    </Modal>
  )
}

const basename = url => url.split("/").pop()
const humanize = basename => basename.replace(/-(GGML|GGUF).*$/gi, "").replace(/[-_]/g, " ")
