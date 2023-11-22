export const FormGrid = ({ class: className = "", ...props }) => (
  // align-self wouldn't add margin when the label is on top
  <div
    class={`grid gap-4 md:[grid-template-columns:min-content_1fr] mb-4 [&_label]:(mt-1.5 md:text-right) ${className}`}
    {...props}
  />
)
