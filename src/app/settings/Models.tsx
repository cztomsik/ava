import { Alert, Button, Table } from "../_components"
import { SettingsPage } from "./SettingsPage"
import { DownloadModal } from "./DownloadModal"
import { useApi } from "../_hooks"
import { basename, humanSize } from "../_util"
import { catalog } from "./catalog"
import { abortCurrent, current, downloadModel } from "./download"
import { ModelImporter } from "./ModelImporter"

export const Models = () => {
  const { data: models = [], del } = useApi("models")

  return (
    <SettingsPage>
      {current.value && <DownloadModal {...current.value} onCancel={abortCurrent} />}

      <ModelImporter />

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
                  <strong class="block py-1.5 text-green-10">Installed</strong>
                ) : (
                  <Button onClick={() => downloadModel(m)}>Download</Button>
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
