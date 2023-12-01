export const Table = ({ class: className = "", ...props }) => (
  <div>
    <div class={`rounded overflow-hidden border(1 neutral-7 b-0) ${className}`}>
      <table class="table-fixed w-full [&_th,&_td]:(p-2 border(b-1 neutral-7)) [&_tr]:even:bg-neutral-3" {...props} />
    </div>
  </div>
)
