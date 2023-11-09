import { Page } from "../_components"
import { ToolForm } from "./ToolForm"
import { err } from "../_util"
import { examples } from "./_examples"

export const EditTool = ({ params: { id } }) => {
  const tool = examples.find(t => t.id === +id) ?? err("Tool not found")

  return (
    <Page>
      <Page.Header title="Edit Tool"></Page.Header>

      <Page.Content>
        <ToolForm tool={tool} onSubmit={() => {}} />
      </Page.Content>
    </Page>
  )
}
