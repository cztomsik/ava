import { Plus } from "lucide"
import { Alert, Button, IconButton, Link, Page, Table } from "../_components"
import { examples } from "./_examples"

export const QuickTools = () => {
  return (
    <Page>
      <Page.Header title="Quick Tools">
        <IconButton title="Create New" icon={Plus} href="/quick-tools/new" />
      </Page.Header>

      <Page.Content>
        <Alert class="mb-8">
          <strong>This feature is experimental.</strong> <br />
          No changes are saved to the database
        </Alert>

        <Table class="max-w-5xl">
          <thead>
            <tr>
              <th class="w-56">Name</th>
              <th>Description</th>
              <th class="w-24"></th>
            </tr>
          </thead>
          <tbody>
            {examples.map(t => (
              <tr>
                <td>
                  <Link class="text-blue-11" href={`/quick-tools/${t.id}`}>
                    {t.name}
                  </Link>
                </td>
                <td>{t.description}</td>
                <td class="text-center">
                  <Button href={`/quick-tools/${t.id}/edit`}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Page.Content>
    </Page>
  )
}
