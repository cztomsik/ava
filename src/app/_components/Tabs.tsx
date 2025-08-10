export const Tabs = ({ class: className = "", children }) => {
  return (
    <div class={`font-medium text-sm text-center text-neutral-9 ${className}`}>
      <div class="flex flex-wrap *:p-4 *:mb-px *:border-b-2 *:border-transparent [&>*.active]:text-blue-10 [&>*.active]:border-blue-10">
        {children}
      </div>
    </div>
  )
}
