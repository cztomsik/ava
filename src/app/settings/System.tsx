import { Value } from "../_components"
import { useQuery } from "../_hooks"
import { SettingsPage } from "./SettingsPage"
import { api } from "../api"

export const System = () => {
  const { data: system } = useQuery(api.getSystemInfo())
  const { data: log } = useQuery(api.getLog())

  return (
    <SettingsPage>
      <h3 class="my-3 text-lg">System info</h3>

      <div class="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 mb-4">
        <Value label="Operating system" value={`${system?.os} ${system?.os_version}`} />
        <Value label="CPU Arch" value={system?.arch} />
        <Value label="CPU count" value={system?.cpu_count} />
        <Value label="Memory" value={system?.total_system_memory} />
      </div>

      <h3 class="my-3 text-lg">Log</h3>
      <pre class="p-4 border border-neutral-6 rounded-md overflow-auto shadow-inner">{log}</pre>
    </SettingsPage>
  )
}
