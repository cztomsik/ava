import { Router, Route } from "preact-router"
import { createHashHistory } from "history"
import { Link } from "./components"
import { Chat } from "./chat/Chat"

export const history = createHashHistory()

export const App = () => (
  <div>
    <AppBar />

    <div class="container my-4">
      <Router history={history as any}>
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

        <ul class="navbar-nav">
          <li class="nav-item dropdown">
            <button class="btn btn-link nav-link dropdown-toggle" data-bs-toggle="dropdown">
              User: John Doe
            </button>

            <ul class="dropdown-menu">
              <li>
                <a class="dropdown-item" href="#">
                  Profile
                </a>
              </li>
              <li>
                <a class="dropdown-item" href="#">
                  Settings
                </a>
              </li>
              <li>
                <hr class="dropdown-divider" />
              </li>
              <li>
                <a class="dropdown-item" href="#">
                  Sign out
                </a>
              </li>
            </ul>
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
