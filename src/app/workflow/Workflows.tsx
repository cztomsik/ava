import { Plus } from "lucide"
import { Alert, IconButton, Link, Page, Table } from "../_components"
import { examples } from "./_examples"
import { router } from "../router"

export const Workflows = () => {
  const createWorkflow = () => {
    const id = Date.now()
    examples.push({ id, name: "New Workflow", steps: [] })
    router.navigate(`/workflows/${id}`)
  }

  return (
    <Page>
      <Page.Header title="Workflows">
        <IconButton title="Create New" icon={Plus} onClick={createWorkflow} />
      </Page.Header>

      <Page.Content>
        <Alert class="mb-8">
          <strong>This feature is experimental.</strong> <br />
          No changes are saved to the database
        </Alert>

        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Kind</th>
            </tr>
          </thead>
          <tbody>
            {examples.map(w => (
              <tr>
                <td>
                  <Link class="text-blue-11" href={`/workflows/${w.id}`}>
                    {w.name}
                  </Link>
                </td>
                <td>Manual</td>
                {/* TODO: Automatic when the first action is a trigger/cron */}
              </tr>
            ))}
          </tbody>
        </Table>
      </Page.Content>
    </Page>
  )
}
