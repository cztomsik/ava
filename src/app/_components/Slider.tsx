// TODO: until this gets fixed the :focus does not really work for ranges in Safari (and macos webview)
//       https://bugs.webkit.org/show_bug.cgi?id=234516

export const Slider = ({ label, onChange, ...props }) => {
  return (
    <div class="vstack gap-2 mb-2">
      <label class="flex justify-between items-center">
        <span>{label}</span>
        <span>{+props.value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        class="w-full appearance-none h-1 rounded-full bg-neutral-4 focus:outline-none thumb:appearance-none thumb:size-2 thumb:-mt-0.75 thumb:bg-neutral-1 thumb:ring-2 thumb:ring-neutral-10 thumb:rounded-full focus:thumb:ring-2 focus:thumb:ring-primary-9"
        onChange={e => onChange(+e.target!.value)}
        {...props}
      />
    </div>
  )
}
