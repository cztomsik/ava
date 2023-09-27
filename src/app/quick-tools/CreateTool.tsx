import { Page } from "../_components"
import { ToolForm } from "./ToolForm"

export const CreateTool = () => {
  const tool = {}

  return (
    <Page>
      <Page.Header title="New Tool"></Page.Header>

      <Page.Content>
        <ToolForm tool={tool} onSubmit={() => {}} />
      </Page.Content>
    </Page>
  )
}
