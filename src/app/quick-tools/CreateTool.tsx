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
    examples.push({ id: examples.length, ...tool })
    router.navigate("/quick-tools")
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
