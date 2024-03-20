import { Page } from "../_components"
import { api } from "../api"
import { router } from "../router"
import { ToolForm } from "./ToolForm"

export const CreateTool = () => {
  const tool = {
    name: "New Tool",
    description: "",
    prompt: "",
  }

  const createTool = async data => {
    const { id } = await api.createQuickTool(data)
    router.navigate(`/quick-tools/${id}`)
  }

  return (
    <Page>
      <Page.Header title="New Tool"></Page.Header>

      <Page.Content>
        <ToolForm tool={tool} onSubmit={createTool} />
      </Page.Content>
    </Page>
  )
}
