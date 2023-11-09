import { Page } from "../_components"
import { router } from "../router"
import { ToolForm } from "./ToolForm"
import { examples } from "./_examples"

export const CreateTool = () => {
  const tool = {
    name: "New Tool",
    prompt: "",
  }

  const createTool = async (tool: any) => {
    const id = examples.length + 1
    examples.push({ id, ...tool })
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
