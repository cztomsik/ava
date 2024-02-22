import { Button, Table, Modal } from "../_components"
import { SettingsPage } from "./SettingsPage"
import { DownloadModal } from "./DownloadModal"
import { useQuery } from "../_hooks"
import { humanSize } from "../_util"
import { abortCurrent, current } from "./download"
import { ModelImporter } from "./ModelImporter"
import { ModelCatalog } from "./ModelCatalog"
import { api } from "../api"

export const Models = () => {
  const { data: models = [] } = useQuery(api.listModels())

  const handleDelete = id => Modal.confirm("Are you sure you want to delete this model?").then(() => api.deleteModel(id))

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
                {m.imported ? (
                  <Button onClick={() => api.deleteModel(m.id)}>Remove</Button>
                ) : (
                  <Button onClick={() => handleDelete(m.id)}>Delete</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <ModelCatalog />
    </SettingsPage>
  )
}
