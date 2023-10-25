import { Alert, Link, Page, Table } from "../_components"
import { examples } from "./_examples"

export const Workflows = () => {
  return (
    <Page>
      <Page.Header title="Workflows" />

      <Page.Content>
        <Alert class="mb-8">
          <strong>This feature is experimental.</strong> <br />
          No changes are saved to the database
        </Alert>

        <Table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {examples.map(w => (
              <tr>
                <td>
                  <Link href={`/workflows/${w.id}`}>{w.name}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Page.Content>
    </Page>
  )
}
