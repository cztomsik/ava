import { NavLink, Page, Tabs } from "../_components"

export const ModelsPage = ({ children }) => {
  return (
    <Page>
      <Page.Header title="Models">
        <Tabs>
          <NavLink href="/models" exact>
            Search
          </NavLink>
          <NavLink href="/models/downloads">Downloads</NavLink>
          <NavLink href="/models/installed">Installed</NavLink>
        </Tabs>
      </Page.Header>

      {children}
    </Page>
  )
}
