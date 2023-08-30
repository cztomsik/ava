import { signal } from "@preact/signals"
import { Chat } from "./chat/Chat"
import { Playground } from "./playground/Playground"
import { QuickTools } from "./quick-tools/QuickTools"
import { Settings } from "./settings/Settings"

const routes = [
  { path: "/chat", component: Chat },
  DEV && { path: "/quick-tools", component: QuickTools },
  { path: "/playground", component: Playground },
  { path: "/settings", component: Settings },
].filter(Boolean)

let currentRoute = signal(routes[0])

export const router = {
  routes,

  navigate(path: string, replace = false) {
    history[replace ? "replaceState" : "pushState"]({}, "", path)
    this.onChange()
  },

  onChange() {
    currentRoute.value = routes.find(route => route.path === location.pathname)
    if (!currentRoute.value) this.navigate(routes[0].path, true)
  },

  get currentRoute() {
    return currentRoute.value
  },

  params: {},
}

addEventListener("popstate", () => router.onChange())
router.onChange()
