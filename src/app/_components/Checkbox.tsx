export const Checkbox = ({ label, value, onChange }) => {
  return (
    <label class="flex items-center">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target!.checked)} />
      <span class="ml-2">{label}</span>
    </label>
  )
}
