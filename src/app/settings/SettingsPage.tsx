import { NavLink, PageContent, PageHeader, Tabs } from "../_components"

export const SettingsPage = ({ children }) => {
  return (
    <>
      <PageHeader title="Settings">
        <Tabs class="-mb-2">
          <NavLink href="/settings" exact>
            Models
          </NavLink>
          {/* <NavLink href="/settings/personalization">Personalization</NavLink> */}
          <NavLink href="/settings/api">API</NavLink>
          <NavLink href="/settings/license">License</NavLink>
        </Tabs>
      </PageHeader>
      <PageContent>{children}</PageContent>
    </>
  )
}
