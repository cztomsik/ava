import { IconButton, Modal, Page } from "../_components"
import { ToolForm } from "./ToolForm"
import { useQuery } from "../_hooks"
import { api } from "../api"
import { router } from "../router"
import { Trash2 } from "lucide"

export const EditTool = ({ params: { id } }) => {
  const { data: tool } = useQuery(id && api.getQuickTool(id))

  const handleGenerate = async data => {
    await api.updateQuickTool(id, data)
    router.navigate(`/quick-tools/${id}`)
  }

  const handleDelete = () =>
    Modal.confirm("Are you sure you want to delete this tool?")
      .then(() => api.deleteQuickTool(id))
      .then(() => router.navigate("/quick-tools", true))

  return (
    <Page>
      <Page.Header title="Edit Tool">
        <IconButton title="Delete" icon={Trash2} onClick={handleDelete} />
      </Page.Header>

      <Page.Content>
        <ToolForm tool={tool} onSubmit={handleGenerate} />
      </Page.Content>
    </Page>
  )
}
