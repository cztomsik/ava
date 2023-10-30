import { Table } from "./Table"

interface TableInputProps {
  data: string[][]
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
    td.textContent = ""
  }
}

/**
 * Simple spreadsheet-like table input
 */
export const TableInput = ({ data }: TableInputProps) => {
  return (
    <Table onMouseDown={handleMouseDown} onKeyDown={handleKeyDown} style="caret-color: black">
      <tbody onPaste={e => console.log(e.clipboardData?.getData("text/html"))}>
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
