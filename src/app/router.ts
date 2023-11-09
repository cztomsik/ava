import { signal } from "@preact/signals"
import { Chat } from "./chat/Chat"
import { Playground } from "./playground/Playground"
import { QuickTools } from "./quick-tools/QuickTools"
import { CreateTool } from "./quick-tools/CreateTool"
import { QuickTool } from "./quick-tools/QuickTool"
import { EditTool } from "./quick-tools/EditTool"
import { Workflows } from "./workflow/Workflows"
import { Workflow } from "./workflow/Workflow"
import { Models } from "./settings/Models"
import { System } from "./settings/System"
import { Api } from "./settings/Api"
import { License } from "./settings/License"

const routes = [
  { path: "/chat", component: Chat },
  { path: "/chat/:id", component: Chat },
  { path: "/quick-tools", component: QuickTools },
  { path: "/quick-tools/new", component: CreateTool },
  { path: "/quick-tools/:id", component: QuickTool },
  { path: "/quick-tools/:id/edit", component: EditTool },
  NEXT && { path: "/workflows", component: Workflows },
  NEXT && { path: "/workflows/:id", component: Workflow },
  { path: "/playground", component: Playground },
  { path: "/settings", component: Models },
  { path: "/settings/system", component: System },
  { path: "/settings/license", component: License },
  { path: "/settings/api", component: Api },
].filter(Boolean) as Array<{ path; component }>

const current = signal({ route: routes[0], params: {} as any })

const patternCache: Record<string, RegExp> = {}

export const router = {
  routes,

  navigate(path: string, replace = false) {
    history[replace ? "replaceState" : "pushState"]({}, "", path)
    this.onChange()
  },

  match(pattern: string) {
    const regex =
      patternCache[pattern] ||
      (patternCache[pattern] = new RegExp(`^${pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)").replace(/\*/g, "(?<all>.*)")}$`))
    return location.pathname.match(regex)
  },

  onChange() {
    for (const r of routes) {
      const match = this.match(r.path)
      if (match) {
        current.value = { route: r, params: match.groups ?? {} }
        return
      }
    }

    this.navigate(routes[0].path, true)
  },

  get currentRoute() {
    return current.value.route
  },

  get params() {
    return current.value.params
  },
}

addEventListener("popstate", () => router.onChange())
router.onChange()
