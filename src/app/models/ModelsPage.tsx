import { Badge, NavLink, Page, Tabs } from "../_components"
import { queue } from "./download"

export const ModelsPage = ({ children }) => {
  return (
    <Page>
      <Page.Header title="Models">
        <Tabs>
          <NavLink href="/models" exact>
            Search
          </NavLink>
          <NavLink href="/models/downloads">
            Downloads
            <Badge value={queue.value.length} />
          </NavLink>
          <NavLink href="/models/installed">Installed</NavLink>
        </Tabs>
      </Page.Header>

      {children}
    </Page>
  )
}
