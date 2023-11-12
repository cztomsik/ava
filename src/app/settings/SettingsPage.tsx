import { NavLink, Page, Tabs } from "../_components"

export const SettingsPage = ({ children }) => {
  return (
    <Page>
      <Page.Header title="Settings">
        <Tabs>
          <NavLink href="/settings" exact>
            Models
          </NavLink>
          <NavLink href="/settings/system">System</NavLink>
          <NavLink href="/settings/api">API</NavLink>
          <NavLink href="/settings/license">License</NavLink>
        </Tabs>
      </Page.Header>

      <Page.Content>{children}</Page.Content>
    </Page>
  )
}
