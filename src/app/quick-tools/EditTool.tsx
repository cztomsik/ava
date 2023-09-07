import { PageContent, PageHeader } from "../_components"
import { ToolForm } from "./ToolForm"
import { examples } from "./_examples"

export const EditTool = ({ params: { id } }) => {
  const tool = examples[id]

  return (
    <>
      <PageHeader title="Edit Tool"></PageHeader>

      <PageContent>
        <ToolForm tool={tool} onSubmit={() => {}} />
      </PageContent>
    </>
  )
}
