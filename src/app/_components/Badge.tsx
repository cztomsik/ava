export const Badge = ({ class: className = "", value }) =>
  value > 0 ? (
    <span class={`ml-1 bg-neutral-6 text-neutral-11 px-2 py-1 text-xs font-bold rounded-full ${className}`}>{value}</span>
  ) : null

export const BadgeExample = () => (
  <div class="flex gap-4 items-center">
    <span>
      Notifications <Badge value={5} />
    </span>
  </div>
)
