import { Button, Table, Modal, Page, IconButton } from "../_components"
import { ModelsPage } from "./ModelsPage"
import { useQuery } from "../_hooks"
import { fmtSize } from "../_util"
import { ModelImporter } from "./ModelImporter"
import { api } from "../api"
import { Info } from "lucide"

export const Models = () => {
  const { data: models = [] } = useQuery(api.listModels())

  const handleInfo = id => Modal.open(ModelInfo, { id })

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
              <th class="w-16"></th>
              <th class="w-24 text-right">Size</th>
              <th class="w-32"></th>
            </tr>
          </thead>
          <tbody>
            {!models.length && (
              <tr>
                <td colSpan={4}>No models installed. You can download models in the Search tab.</td>
              </tr>
            )}

            {models.map(m => (
              <tr>
                <td class="capitalize">{m.name}</td>
                <td class="text-right">
                  <IconButton icon={Info} onClick={() => handleInfo(m.id)} />
                </td>
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

const ModelInfo = ({ id, resolve }) => {
  const { data: model = {}, loading: l1 } = useQuery(api.getModel(id))
  const { data: meta = [], loading: l2 } = useQuery(api.getModelMeta(id))

  return (
    <Modal title={model.name ?? "Model info"} loading={l1 || l2} onClose={() => resolve()}>
      <p class="text-neutral-11 -mt-2 mb-4">{model.path}</p>

      <Table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {meta.map(({ key, value }) => (
            <tr>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Modal>
  )
}
