export const Table = ({ class: className = "", ...props }) => (
  <div class={`relative overflow-x-auto ${className}`}>
    <table class="table-fixed w-full [&_th,&_td]:p-2 [&_th,&_td]:border-b [&_th,&_td]:border-neutral-7 [&_tr]:even:bg-neutral-2" {...props} />
  </div>
)
