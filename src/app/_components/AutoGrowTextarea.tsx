export const AutoGrowTextarea = ({ class: className = "", value, onChange, ...props }) => (
  <div class="vstack relative">
    <textarea class={`!absolute !inset-0 ${className}`} value={value} onInput={e => onChange(e.target!.value)} {...props} />
    <div
      // render to invisible pseudo element, used to measure the height
      class={`form-control ${className} invisible whitespace-pre-wrap max-h-[30vh] overflow-y-hidden after:content-[attr(data-value)_"_"]`}
      data-value={value}
    />
  </div>
)
