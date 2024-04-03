import { Button, Table, Modal, Page } from "../_components"
import { ModelsPage } from "./ModelsPage"
import { useQuery } from "../_hooks"
import { fmtSize } from "../_util"
import { ModelImporter } from "./ModelImporter"
import { api } from "../api"

export const Models = () => {
  const { data: models = [] } = useQuery(api.listModels())

  const handleDelete = id => Modal.confirm("Are you sure you want to delete this model?").then(() => api.deleteModel(id))

  return (
    <ModelsPage>
      <Page.Content>
        <ModelImporter />

        <h2 class="mt-4 mb-2 text-xl">Installed models</h2>
        <Table>
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
                <td colSpan={3}>No models installed. You can download models in the Search tab.</td>
              </tr>
            )}

            {models.map(m => (
              <tr>
                <td class="capitalize">{m.name}</td>
                <td class="text-right">{fmtSize(m.size)}</td>
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
      </Page.Content>
    </ModelsPage>
  )
}
