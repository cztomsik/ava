import { Router, Route } from "preact-router"
import { ErrorBoundary, Link } from "./_components"
import { Chat } from "./chat/Chat"
import { Playground } from "./playground/Playground"

export const App = () => (
  <ErrorBoundary>
    <AppBar />

    <div class="container my-4">
      <Router>
        <Route path="/:id?" component={Chat} />
        <Route path="/playground" component={Playground} />
      </Router>
    </div>
  </ErrorBoundary>
)

const AppBar = () => (
  <div class="navbar navbar-expand-md bg-primary navbar-dark">
    <div class="container">
      <a class="navbar-brand" href="#">
        Ava
      </a>

      <div class="navbar-collapse d-print-none">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <Link class="nav-link" href="/">
              Chat
            </Link>
          </li>
          <li class="nav-item">
            <Link class="nav-link" href="/playground">
              Playground
            </Link>
          </li>
        </ul>
      </div>
    </div>
  </div>
)
