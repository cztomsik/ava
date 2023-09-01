import { signal } from "@preact/signals"
import { Chat } from "./chat/Chat"
import { Playground } from "./playground/Playground"
import { QuickTools } from "./quick-tools/QuickTools"
import { QuickTool } from "./quick-tools/QuickTool"
import { EditTool } from "./quick-tools/EditTool"
import { CreateTool } from "./quick-tools/CreateTool"
import { Models } from "./settings/Models"
import { License } from "./settings/License"

const routes = [
  { path: "/chat", component: Chat },
  DEV && { path: "/quick-tools", component: QuickTools },
  DEV && { path: "/quick-tools/new", component: CreateTool },
  DEV && { path: "/quick-tools/:id", component: QuickTool },
  DEV && { path: "/quick-tools/:id/edit", component: EditTool },
  { path: "/playground", component: Playground },
  { path: "/settings", component: Models },
  { path: "/settings/license", component: License },
].filter(Boolean)

const current = signal({ route: routes[0], params: {} })

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
      (patternCache[pattern] = new RegExp(
        `^${pattern.replace(/:(\w+)/g, "(?<$1>[^/]+)").replace(/\*/g, "(?<all>.*)")}$`
      ))
    return location.pathname.match(regex)
  },

  onChange() {
    for (const r of routes) {
      const match = this.match(r.path)
      if (match) {
        current.value = { route: r, params: match.groups }
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
