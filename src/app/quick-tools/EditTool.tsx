import { Page } from "../_components"
import { ToolForm } from "./ToolForm"
import { err } from "../_util"
import { examples } from "./_examples"
import { router } from "../router"

export const EditTool = ({ params: { id } }) => {
  const tool = examples.find(t => t.id === +id) ?? err("Tool not found")

  const handleSubmit = data => {
    Object.assign(tool, data)
    router.navigate(`/quick-tools/${id}`)
  }

  return (
    <Page>
      <Page.Header title="Edit Tool"></Page.Header>

      <Page.Content>
        <ToolForm tool={tool} onSubmit={handleSubmit} />
      </Page.Content>
    </Page>
  )
}
