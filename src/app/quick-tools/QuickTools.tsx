import { Button, Link, PageContent, PageHeader, Table } from "../_components"
import { examples } from "./examples"

export const QuickTools = () => {
  return (
    <>
      <PageHeader title="Quick Tools" description="Shortcuts for common tasks">
        <Button class="ms-auto" href="/quick-tools/new">
          Create New
        </Button>
      </PageHeader>

      <PageContent>
        <Table>
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
        </Table>
      </PageContent>
    </>
  )
}
