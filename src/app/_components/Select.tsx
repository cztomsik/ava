import { useState } from "preact/hooks"

export const Select = ({ class: className = "", ...props }) => (
  <div class={`relative ${className}`}>
    <select class="block w-full overflow-hidden pr-6" {...props} />
    <div class="hstack pointer-events-none absolute inset-y-0 right-1.5 text-neutral-11">
      <svg class="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
)

export const SelectExample = () => {
  const [value, setValue] = useState("option2")

  return (
    <div class="space-y-4">
      <Select value={value} onChange={e => setValue(e.target.value)}>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>

      <p class="text-sm text-neutral-11">Selected: {value}</p>
    </div>
  )
}
