import { Link, NavLink, PageContent, PageHeader } from "../_components"
import { QuickTool } from "./QuickTool"
import { examples } from "./examples"

export const QuickTools = ({ params }) => {
  if (!params.id) return <Listing />

  return (
    <>
      <aside>
        <NavLink href="/quick-tools">Back to Listing</NavLink>
        <ul class="nav flex-column mt-4">
          {examples.map((spec, i) => (
            <NavLink activeClass="text-decoration-none text-body" href={`/quick-tools/${i}`}>
              {spec.title}
            </NavLink>
          ))}
        </ul>
      </aside>

      <QuickTool spec={examples[+params.id]} />
    </>
  )
}

const Listing = () => (
  <>
    <PageHeader title="Quick Tools" description="Shortcuts to common tasks" />

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
