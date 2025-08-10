import { useState } from "preact/hooks"

export const Checkbox = ({ label, value, onChange }) => {
  return (
    <label class="flex items-center">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target!.checked)} />
      <span class="ml-2">{label}</span>
    </label>
  )
}

export const CheckboxExample = () => {
  const [checked, setChecked] = useState(true)

  return (
    <div>
      <Checkbox label="Check me" value={checked} onChange={setChecked} />
    </div>
  )
}
