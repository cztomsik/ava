export const FormGrid = ({ class: className = "", ...props }) => (
  // align-self wouldn't add margin when the label is on top
  <div class={`grid grid-cols-[auto_1fr] gap-4 mb-4 [&_label]:(mt-1.5 md:text-right) ${className}`} {...props} />
)
