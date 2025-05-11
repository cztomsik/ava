import { Badge, NavLink, Page, Tabs } from "../_components"
import { queue } from "./download"
import { basename } from "../_util"
import { useMemo } from "preact/hooks"
import { computed } from "@preact/signals"

export const ModelsPage = ({ children }) => {
  return (
    <Page>
      <Page.Header title="Models">
        {queue.value.length > 0 && <QuickInfo {...queue.value[0]} />}

        <Tabs>
          <NavLink href="/models" exact>
            Installed
          </NavLink>
          <NavLink href="/models/search">Search</NavLink>
          <NavLink href="/models/downloads">
            Downloads
            <Badge class="animate-pulse" value={queue.value.length} />
          </NavLink>
        </Tabs>
      </Page.Header>

      {children}
    </Page>
  )
}

const QuickInfo = ({ url, size, progress }) => {
  const perc = useMemo(() => computed(() => `${((100 * progress.value) / size.value).toFixed(2)}%`), [progress, size])

  return (
    <div class="hstack text-sm font-medium text-neutral-9 mr-6 mb-1.5">
      Downloading {basename(url)}
      <span class="w-20 text-right">({perc})</span>
    </div>
  )
}
