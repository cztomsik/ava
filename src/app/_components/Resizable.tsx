import { useResize } from "../_hooks"

export const Resizable = ({
  as: Comp = "div" as any,
  sizes,
  storageKey = null as any,
  rtl = false,
  class: clz = "",
  children = null as any,
  ...props
}) => {
  const { style, onMouseDown } = useResize({ sizes, storageKey, rtl })

  return (
    <Comp class={`relative ${clz}`} style={style} {...props}>
      {children}

      <div class={`absolute ${rtl ? "left" : "right"}-0 inset-y-0 w-2 cursor-col-resize`} onMouseDown={onMouseDown} />
    </Comp>
  )
}
