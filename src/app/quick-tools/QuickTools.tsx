import { Button, Link, PageContent, PageHeader, Table } from "../_components"
import { examples } from "./_examples"

export const QuickTools = () => {
  return (
    <>
      <PageHeader title="Quick Tools">
        <Button href="/quick-tools/new">Create New</Button>
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
                  <Link href={`/quick-tools/${i}`}>{spec.name}</Link>
                </td>
                <td>TODO: description</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </PageContent>
    </>
  )
}
