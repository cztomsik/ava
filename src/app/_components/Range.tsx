export const Range = ({ label, onChange, ...props }) => {
  return (
    <div class="vstack gap-2 mb-2">
      <label class="flex justify-between items-center">
        <span>{label}</span>
        <span>{props.value}</span>
      </label>
      <input
        type="range"
        class="w-full appearance-none h-1 rounded-full bg-neutral-4 focus:outline-none [&::-webkit-slider-thumb]:(appearance-none w-2 h-2 -mt-0.75 bg-neutral-1 ring ring-opacity-100 ring-primary-10 rounded-full)"
        onChange={e => onChange(+e.target!.value)}
        {...props}
      />
    </div>
  )
}
