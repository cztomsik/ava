import { Page } from "../_components"
import { ToolForm } from "./ToolForm"
import { examples } from "./_examples"

export const EditTool = ({ params: { id } }) => {
  const tool = examples[id]

  return (
    <Page>
      <Page.Header title="Edit Tool"></Page.Header>

      <Page.Content>
        <ToolForm tool={tool} onSubmit={() => {}} />
      </Page.Content>
    </Page>
  )
}
