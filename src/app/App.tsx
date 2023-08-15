import { Router, Route, Redirect, Switch } from "wouter-preact"
import { ErrorBoundary, Layout, NavLink } from "./_components"
import { Chat } from "./chat/Chat"
import { QuickTools } from "./quick-tools/QuickTools"
import { Playground } from "./playground/Playground"

export const App = () => (
  <ErrorBoundary>
    <Router>
      <div class="d-flex flex-column vh-100">
        <AppBar />

        <div class="flex-fill">
          <Layout class="container my-4" scroll>
            <Switch>
              <Route path="/chat/:id?" component={Chat} />
              <Route path="/quick-tools/:id?" component={QuickTools} />
              <Route path="/playground" component={Playground} />
              <Redirect href="/chat" />
            </Switch>
          </Layout>
        </div>
      </div>
    </Router>
  </ErrorBoundary>
)

const AppBar = () => (
  <div class="navbar navbar-expand-md bg-primary navbar-dark">
    <div class="container">
      <a class="navbar-brand" href="/">
        Ava
      </a>

      <div class="navbar-collapse d-print-none">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <NavLink class="nav-link" href="/chat">
              Chat
            </NavLink>
          </li>
          <li class="nav-item">
            <NavLink class="nav-link" href="/quick-tools">
              Quick Tools
            </NavLink>
          </li>
          <li class="nav-item">
            <NavLink class="nav-link" href="/playground">
              Playground
            </NavLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
)
