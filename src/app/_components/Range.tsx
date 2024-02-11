export const Range = ({ label, onChange, ...props }) => {
  return (
    <div class="vstack gap-2">
      <label class="flex justify-between items-center">
        <span>{label}</span>
        <input type="number" {...props} />
      </label>
      <input type="range" class="w-full" onChange={e => onChange(+e.target!.value)} {...props} />
    </div>
  )
}
