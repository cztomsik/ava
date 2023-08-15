import { Button, Link, PageContent, PageHeader } from "../_components"
import { QuickTool } from "./QuickTool"
import { examples } from "./examples"

export const QuickTools = ({ params }) => {
  if (params.id) return <QuickTool params={params} />

  return (
    <>
      <PageHeader title="Quick Tools" description="Shortcuts to common tasks">
        <Button class="ms-auto" href="/quick-tools/new">
          Create New
        </Button>
      </PageHeader>

      <PageContent>
        <table class="table table-striped table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {examples.map((spec, i) => (
              <tr>
                <td>
                  <Link href={`/quick-tools/${i}`}>{spec.title}</Link>
                </td>
                <td>{spec.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageContent>
    </>
  )
}
