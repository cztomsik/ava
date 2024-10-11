import { Alert } from "../_components"
import { SettingsPage } from "./SettingsPage"

export const Api = () => {
  return (
    <SettingsPage>
      <Alert class="mb-8">
        <strong>This feature is experimental.</strong> <br />
        The API is not yet stable and may change in the future.
      </Alert>

      <iframe src="/swagger-ui" className="w-full h-full" />
    </SettingsPage>
  )
}
