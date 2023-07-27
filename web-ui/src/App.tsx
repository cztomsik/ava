import { h } from "preact"
import { Router, Route } from "preact-router"
import { createHashHistory } from "history"
import { Chat } from "./Chat"
import { Search } from "./Search"
import { Help } from "./Help"
import { Link } from "./components"

export const history = createHashHistory()

export const App = () => (
  <div>
    <AppBar />

    <div class="container mt-4">
      <Router history={history as any}>
        <Route path="/:index?" component={Chat} />
        <Route path="/search" component={Search} />
        <Route path="/help" component={Help} />
      </Router>
    </div>
  </div>
)

const AppBar = () => (
  <div class="navbar navbar-expand-md bg-primary navbar-dark">
    <div class="container">
      <a class="navbar-brand" href="#">
        The Box
      </a>

      <div class="navbar-collapse">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <Link class="nav-link" href="/">
              Chat
            </Link>
          </li>
          <li class="nav-item">
            <Link class="nav-link" href="/search">
              Search
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
