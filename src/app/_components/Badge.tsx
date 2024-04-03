export const Badge = ({ class: className = "", value }) =>
  value > 0 ? (
    <span class={`ml-1 bg-neutral-6 text-neutral-11 px-2 py-1 text-xs font-bold rounded-full ${className}`}>{value}</span>
  ) : null
