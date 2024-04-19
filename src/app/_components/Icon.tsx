import { X } from "lucide"

export const Icon = ({ icon }) => toVdom(icon)

Icon.Spinner = () => (
  <span class="opacity-40 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current [border-inline-end-color:#0000] animate-[spin_1.5s_linear_infinite] dark:text-white" />
)

const toVdom = ([Tag, attrs, children = null as any]) => <Tag {...attrs}>{children?.map(toVdom)}</Tag>

// TODO: fix this hack
X[1].width = X[1].height = 20
X[1]["stroke-width"] = 1.75
