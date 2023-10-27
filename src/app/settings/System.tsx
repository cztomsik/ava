import { Value } from "../_components"
import { useApi } from "../_hooks"
import { SettingsPage } from "./SettingsPage"

export const System = () => {
  const { data: system } = useApi("system-info")
  const { data: log } = useApi("log")

  return (
    <SettingsPage>
      <h3 className="my-3 text-lg">System info</h3>

      <div class="grid grid-cols(3 lg:4 xl:5 2xl:6) gap-3 mb-4">
        <Value label="Operating system" value={`${system?.os} ${system?.os_version}`} />
        <Value label="CPU Arch" value={system?.arch} />
        <Value label="CPU count" value={system?.cpu_count} />
        <Value label="Memory" value={system?.total_system_memory} />
      </div>

      <h3 className="my-3 text-lg">Log</h3>
      <pre class="p-4 border(1 neutral-6) rounded-md overflow-auto shadow-inner">{log}</pre>
    </SettingsPage>
  )
}
