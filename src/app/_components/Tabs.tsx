export const Tabs = ({ class: className = "", children }) => {
  return (
    <div class={`font-medium text(sm center neutral-9) ${className}`}>
      <div class="flex flex-wrap [&>*]:(p-4 mb-px border(b-2 transparent) [&.active]:(text-blue-10 border-blue-10))">
        {children}
      </div>
    </div>
  )
}
