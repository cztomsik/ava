import { PageContent, PageHeader } from "../_components"
import { ToolForm } from "./ToolForm"

export const CreateTool = () => {
  const tool = {}

  return (
    <>
      <PageHeader title="New Tool" description="Create a new Tool"></PageHeader>

      <PageContent>
        <ToolForm tool={tool} onSubmit={() => {}} />
      </PageContent>
    </>
  )
}
