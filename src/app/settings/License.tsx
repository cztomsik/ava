import { useSignal } from "@preact/signals"
import { useMemo } from "preact/hooks"
import { SettingsPage } from "./SettingsPage"
import { Markdown } from "../_components"

export const License = () => {
  const license = useSignal("Loading...")

  useMemo(async () => {
    license.value = await fetch("/LICENSE.md").then(r => r.text())
  }, [])

  return (
    <SettingsPage>
      <h1 class="text-lg font-bold">License</h1>
      <div class="flex-1 p-4 border(1 neutral-6) rounded-md overflow-auto shadow-inner my-4">
        <Markdown class="max-w-2xl" input={license.value}></Markdown>
      </div>

      <h2 class="text-lg font-bold">Open Source acknowledgement</h2>
      <p>
        This Software, incorporates and uses open-source software components. The use of these components is acknowledged,
        and their respective licenses are included in the LICENSES.md file which is shown above.
      </p>
    </SettingsPage>
  )
}
