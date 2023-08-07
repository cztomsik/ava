import { Router, Route } from "preact-router"
import { Link } from "./components"
import { Chat } from "./chat/Chat"

export const App = () => (
  <div>
    <AppBar />

    <div class="container my-4">
      <Router>
        <Route path="/:index?" component={Chat} />
        <Route path="/wiki" component={TODO} />
        <Route path="/files" component={TODO} />
        <Route path="/playground" component={TODO} />
        <Route path="/help" component={TODO} />
      </Router>
    </div>
  </div>
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
            <Link class="nav-link" href="/wiki">
              Wiki
            </Link>
          </li>
          <li class="nav-item">
            <Link class="nav-link" href="/files">
              Files
            </Link>
          </li>
          <li class="nav-item">
            <Link class="nav-link" href="/playground">
              Playground
            </Link>
          </li>
          <li class="nav-item">
            <Link class="nav-link" href="/help">
              Help
            </Link>
          </li>
        </ul>
      </div>
    </div>
  </div>
)

const TODO = () => (
  <>
    <h2>TODO</h2>
    <p>TODO</p>
  </>
)
