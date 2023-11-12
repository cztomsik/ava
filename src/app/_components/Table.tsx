export const Table = ({ class: className = "", ...props }) => (
  <table
    class={`table-fixed border-collapse [&_th,&_td]:(p-2 border(1 neutral-7)) [&_tr]:even:bg-neutral-3 ${className}`}
    {...props}
  />
)
