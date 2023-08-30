import { Router, Route, Redirect, Switch } from "wouter-preact"
import { ErrorBoundary, Layout, Link, NavLink, SearchField } from "./_components"
import { Chat } from "./chat/Chat"
import { QuickTools } from "./quick-tools/QuickTools"
import { Playground } from "./playground/Playground"
import { Settings } from "./settings/Settings"
import { useApi, selectedModel } from "./_hooks"
import { useEffect } from "preact/hooks"

export const App = () => (
  <ErrorBoundary class="text-base bg-white dark:bg-neutral-800 text-neutral-900">
    <Router>
      <Layout class="h-screen">
        {/*
        <BuyButton />
        */}

        <Sidebar />

        <Layout scroll>
          <Switch>
            <Route path="/chat/:id?" component={Chat} />
            {DEV && <Route path="/quick-tools/:id?" component={QuickTools} />}
            <Route path="/playground" component={Playground} />
            <Route path="/settings" component={Settings} />
            <Redirect href="/chat" />
          </Switch>
        </Layout>
      </Layout>
    </Router>
  </ErrorBoundary>
)

const Sidebar = () => (
  <aside class="vstack gap-2 p-4 bg-neutral-100 dark:bg-neutral-700 border-r-1 border-neutral-300" data-drag-window>
    <SearchField class="mt-6 mb-4" />

    <SidebarHeader title="Main" />
    <SidebarLink href="/chat">Chat</SidebarLink>
    {DEV && <SidebarLink href="/quick-tools">Quick Tools</SidebarLink>}
    <SidebarLink href="/playground">Playground</SidebarLink>

    <SidebarHeader title="Other" />
    <SidebarLink href="/settings">Settings</SidebarLink>

    <div class="vstack mt-auto">
      <label>Model</label>
      <ModelSelect class="mt-2 w-40" />
    </div>
  </aside>
)

const SidebarHeader = ({ title }) => (
  <h2 class="mt-6 ml-3 text-xs font-bold text-gray-400 dark:text-gray-400">{title}</h2>
)

const SidebarLink = props => (
  <NavLink
    class="rounded font-semibold py-2 px-3 text-neutral-900"
    activeClass="bg-neutral-200 dark:bg-neutral-600"
    {...props}
  />
)

const BuyButton = () =>
  DEV && (
    <a class="me-2" href="http://www.avapls.com/" target="_blank">
      Buy License
    </a>
  )

const ModelSelect = ({ class: className = "" }) => {
  const { data: models, loading } = useApi("models")

  useEffect(() => {
    selectedModel.value = models?.[0]?.name
  }, [models])

  return (
    <select
      class={`form-select ${className}`}
      value={selectedModel.value}
      onChange={e => (selectedModel.value = e.target.value)}
    >
      {loading && <option>Loading...</option>}

      {models?.map(model => (
        <option key={model.name} value={model.name}>
          {model.name}
        </option>
      ))}
    </select>
  )
}
