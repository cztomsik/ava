import { parseHTML, indexOf, slice } from "../_util"
import { Table } from "./Table"

interface TableInputProps {
  value: string[][]
  onChange?: (value: string[][]) => void
}

/**
 * Simple spreadsheet-like table input
 */
export const TableInput = ({ value }: TableInputProps) => {
  return (
    <Table
      onFocus={restoreFocus}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      style="caret-color: transparent"
    >
      <tbody>
        {value.map(row => (
          <tr>
            {row.map(cell => (
              <td tabIndex={-1} contentEditable onFocus={updateSelection}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

const restoreFocus = e => (e.target.querySelector("[aria-selected=true]") ?? e.target.querySelector("td"))?.focus()

const updateSelection = e => {
  e.target
    .closest("table")!
    .querySelectorAll("[aria-selected=true]")
    .forEach(td => ((td.tabIndex = -1), td.removeAttribute("aria-selected")))
  e.target.setAttribute("aria-selected", "true")
  e.target.tabIndex = 0
}

const handleMouseDown = e => {
  if (e.target instanceof HTMLTableCellElement) {
    e.preventDefault()
    window.getSelection()?.setPosition(e.target, 0)
  }
}

const handleKeyDown = e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab" || e.key === "Shift") return

  const { td, tr, x } = findCell(e)

  // Move focus
  if (e.key.startsWith("Arrow") || e.key === "Enter") {
    // TODO: Handle selection
    if (e.shiftKey) return

    e.preventDefault()

    switch (e.key) {
      case "ArrowLeft":
        return td.previousElementSibling?.focus()
      case "ArrowRight":
        return td.nextElementSibling?.focus()
      case "ArrowUp":
        return tr.previousElementSibling?.children[x]?.focus()
      case "ArrowDown":
      case "Enter":
        return tr.nextElementSibling?.children[x]?.focus()
    }
  }

  // Delete cell content
  const selection = window.getSelection()
  if (selection?.anchorOffset === 0) {
    selection.selectAllChildren(td)
  }
}

const findCell = (e: any) => {
  const td = e.target.closest("td")
  const tr = td.closest("tr")
  const x = indexOf(tr.children, td)
  const y = indexOf(tr.parentElement.children, tr)

  return { td, tr, x, y }
}

const handlePaste = e => {
  e.preventDefault()

  if (e.target instanceof HTMLTableCellElement) {
    const html = e.clipboardData?.getData("text/html")
    const text = e.clipboardData?.getData("text/plain")
    const data = html
      ? [...parseHTML(html).querySelectorAll("tr")].map(tr => [...tr.querySelectorAll("td")].map(td => td.textContent ?? ""))
      : text.split("\n").map(r => r.split("\t"))

    if (data) {
      const { tr, x, y } = findCell(e)

      slice(tr.parentElement.children, y, y + data.length).forEach((tr, i) => {
        slice(tr.children, x, x + data[i].length).forEach((td, j) => {
          td.textContent = data[i][j]
        })
      })
    }
  }
}
