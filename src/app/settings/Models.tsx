import { useSignal } from "@preact/signals"
import { Alert, Button, Link, Modal, Table } from "../_components"
import { SettingsPage } from "./SettingsPage"
import { useApi } from "../_hooks"
import { jsonLines, basename, humanSize } from "../_util"
import { catalog } from "./catalog"

export const Models = () => {
  const { data: models = [], post, del } = useApi("models")
  const progress = useSignal<any>(null)
  const ctrl = useSignal<AbortController | null>(null)

  const download = async ({ url, size }) => {
    progress.value = { url, size, progress: 0 }
    ctrl.value = new AbortController()

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        body: JSON.stringify(url),
        signal: ctrl.value.signal,
      })

      for await (const d of jsonLines(res.body!.getReader())) {
        if ("error" in d) {
          throw new Error(`Unexpected error: ${d.error}`)
        }

        if ("progress" in d) {
          progress.value = { ...progress.value, ...d }
        }

        if ("path" in d) {
          await post({ name: basename(url.slice(0, -5)), path: d.path })
        }
      }
    } catch (e) {
      if (e.code !== DOMException.ABORT_ERR) {
        throw e
      }
    } finally {
      progress.value = null
    }
  }

  const cancel = () => {
    progress.value = null
    ctrl.value?.abort()
  }

  return (
    <SettingsPage>
      {progress.value && <ProgressModal {...progress.value} onCancel={cancel} />}

      {/* <Alert>
        <strong>This page is under construction.</strong> <br />
        For now, the models are searched in and downloaded to your Downloads folder. <br />
        <br />
        You can download one of the models below, or you can find more models on the Wiki page below. <br />
        <br />
        <Button href="https://www.reddit.com/r/LocalLLaMA/wiki/models/">Open LocallLama Reddit</Button>
      </Alert> */}

      <h2 class="mt-4 mb-2 text-xl">Installed models</h2>
      <Table class="max-w-5xl">
        <thead>
          <tr>
            <th>Model</th>
            <th class="w-24 text-right">Size</th>
            <th class="w-32"></th>
          </tr>
        </thead>
        <tbody>
          {!models.length && (
            <tr>
              <td colSpan={3}>No models installed. Download one from the catalog below.</td>
            </tr>
          )}

          {models.map(m => (
            <tr>
              <td class="capitalize">{m.name}</td>
              <td class="text-right">{humanSize(m.size)}</td>
              <td class="text-center">
                <Button onClick={() => del(m.id)}>Delete</Button>
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
            <th class="w-24 text-right">Size</th>
            <th class="w-32"></th>
          </tr>
        </thead>
        <tbody>
          {catalog.map(m => (
            <tr>
              <td class="capitalize">{basename(m.url.slice(0, -5))}</td>
              <td>{m.url.split("/")[3]}</td>
              <td class="text-right">{humanSize(m.size)}</td>
              <td class="text-center">
                {models.find(({ name }) => name === basename(m.url).slice(0, -5)) ? (
                  <strong class="text-green-10">Installed</strong>
                ) : (
                  <Button onClick={() => download(m)}>Download</Button>
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

const ProgressModal = ({ url, size, progress, onCancel }) => {
  const percent = (progress / size) * 100

  return (
    <Modal class="w-[30rem]" title={`Download in Progress`} onClose={onCancel}>
      <div class="flex justify-between">
        <span>Downloading {basename(url)}</span>
        <span>{percent.toFixed(2)}%</span>
      </div>

      <div class="mt-4 h-1 w-full bg-neutral-7">
        <div class="h-1 bg-blue-9" style={`width: ${percent}%`}></div>
      </div>

      <div class="mt-4 flex justify-between">
        <span>
          {humanSize(progress)} / {humanSize(size)}
        </span>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </Modal>
  )
}
