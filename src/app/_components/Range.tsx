// TODO: until this gets fixed the :focus does not really work for ranges in Safari (and macos webview)
//       https://bugs.webkit.org/show_bug.cgi?id=234516

export const Range = ({ label, onChange, ...props }) => {
  return (
    <div class="vstack gap-2 mb-2">
      <label class="flex justify-between items-center">
        <span>{label}</span>
        <span>{+props.value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        class="w-full appearance-none h-1 rounded-full bg-neutral-4 focus:outline-none [&::-webkit-slider-thumb]:(appearance-none w-2 h-2 -mt-0.75 bg-neutral-1 ring ring-neutral-10 rounded-full) focus:[&::-webkit-slider-thumb]:(ring-primary-9 ring-opacity-100)"
        onChange={e => onChange(+e.target!.value)}
        {...props}
      />
    </div>
  )
}
