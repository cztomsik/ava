import { signal, computed } from "@preact/signals"
import { Chat } from "./chat/Chat"
import { Playground } from "./playground/Playground"
import { QuickTools } from "./quick-tools/QuickTools"
import { CreateTool } from "./quick-tools/CreateTool"
import { QuickTool } from "./quick-tools/QuickTool"
import { EditTool } from "./quick-tools/EditTool"
import { SearchModels } from "./models/SearchModels"
import { DownloadManager } from "./models/DownloadManager"
import { Models } from "./models/Models"
import { Settings } from "./settings/Settings"
import { System } from "./settings/System"
import { Api } from "./settings/Api"
import { License } from "./settings/License"

const routes = [
  { path: "/", component: () => router.navigate("/chat") },
  { path: "/chat", component: Chat },
  { path: "/chat/:id", component: Chat },
  { path: "/quick-tools", component: QuickTools },
  { path: "/quick-tools/new", component: CreateTool },
  { path: "/quick-tools/:id", component: QuickTool },
  { path: "/quick-tools/:id/edit", component: EditTool },
  { path: "/playground", component: Playground },
  { path: "/models", component: SearchModels },
  { path: "/models/downloads", component: DownloadManager },
  { path: "/models/installed", component: Models },
  { path: "/settings", component: Settings },
  { path: "/settings/system", component: System },
  { path: "/settings/license", component: License },
  { path: "/settings/api", component: Api },
].filter(Boolean) as Array<{ path; component }>

const path = signal(location.pathname)
addEventListener("popstate", () => (path.value = location.pathname))

const current = computed(() => {
  for (const route of routes) {
    const match = router.match(route.path)
    if (match) {
      return { route, params: match.groups ?? {} }
    }
  }

  return { route: routes[0], params: {} }
})

const patternCache: Record<string, RegExp> = {}

export const router = {
  routes,

  navigate(newPath: string, replace = false) {
    history[replace ? "replaceState" : "pushState"]({}, "", newPath)
    path.value = location.pathname
  },

  match(pattern: string) {
    const regex =
      patternCache[pattern] ||
      (patternCache[pattern] = new RegExp(`^${pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)").replace(/\*/g, "(?<all>.*)")}$`))
    return path.value.match(regex)
  },

  get current() {
    return current.value
  },
}
