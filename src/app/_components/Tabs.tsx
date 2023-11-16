export const Tabs = ({ class: className = "", children }) => {
  return (
    <div class={`font-medium text(sm center neutral-9) ${className}`}>
      <div class="flex flex-wrap children:(p-4 mb-px border(b-2 transparent)) children:aria-current:(text-blue-10 border-blue-10)">
        {children}
      </div>
    </div>
  )
}
