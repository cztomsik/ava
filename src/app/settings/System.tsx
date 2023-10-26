import { useApi } from "../_hooks"
import { SettingsPage } from "./SettingsPage"

export const System = () => {
  const { data: system } = useApi("system-info")
  const { data: log } = useApi("log")

  return (
    <SettingsPage>
      <h3 className="my-3 text-lg">System info</h3>

      <div class="grid grid-cols(3 lg:4 xl:5 2xl:6) gap-3 mb-4">
        <div class="vstack">
          <label class="text-gray-11">Operating system</label>
          <span>{system?.os}</span>
        </div>

        <div class="vstack">
          <label class="text-gray-11">CPU Arch</label>
          <span>{system?.arch}</span>
        </div>

        <div class="vstack">
          <label class="text-gray-11">CPU count</label>
          <span>{system?.cpu_count}</span>
        </div>

        <div class="vstack">
          <label class="text-gray-11">Memory</label>
          <span>{system?.total_system_memory}</span>
        </div>
      </div>

      <h3 className="my-3 text-lg">Log</h3>
      <pre class="p-4 border(1 neutral-6) rounded-md overflow-auto shadow-inner">{log}</pre>
    </SettingsPage>
  )
}
