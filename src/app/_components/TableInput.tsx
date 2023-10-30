import { parseHTML } from "../_util"
import { Table } from "./Table"

interface TableInputProps {
  data: string[][]
}

/**
 * Simple spreadsheet-like table input
 */
export const TableInput = ({ data }: TableInputProps) => {
  return (
    <Table onMouseDown={handleMouseDown} onKeyDown={handleKeyDown} onPaste={handlePaste} style="caret-color: transparent">
      <tbody>
        {data.map(row => (
          <tr>
            {row.map(cell => (
              <td contentEditable>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

const handleMouseDown = e => {
  if (e.target instanceof HTMLTableCellElement) {
    e.preventDefault()
    window.getSelection()?.setPosition(e.target, 0)
  }
}

const handleKeyDown = e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Tab" || e.key === "Shift") return

  const td = e.target instanceof HTMLTableCellElement ? e.target : e.target.closest("td")
  const tr = td.closest("tr")
  const index = [...tr.children].indexOf(td)

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
        return tr.previousElementSibling?.querySelectorAll("td")[index]?.focus()
      case "ArrowDown":
      case "Enter":
        return tr.nextElementSibling?.querySelectorAll("td")[index]?.focus()
    }
  }

  // Delete cell content
  const selection = window.getSelection()
  if (selection?.anchorOffset === 0) {
    selection.selectAllChildren(td)
  }
}

const handlePaste = e => {
  e.preventDefault()

  if (e.target instanceof HTMLTableCellElement) {
    const html = e.clipboardData?.getData("text/html")

    if (html) {
      const data = [...parseHTML(html).querySelectorAll("tr")].map(tr =>
        [...tr.querySelectorAll("td")].map(td => td.textContent)
      )

      console.log("paste", data)
    }
  }
}
