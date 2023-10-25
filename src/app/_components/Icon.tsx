import { X } from "lucide"

export const Icon = ({ icon }) => toVdom(icon)

const toVdom = ([Tag, attrs, children = null as any]) => <Tag {...attrs}>{children?.map(toVdom)}</Tag>

// TODO: fix this hack
X[1].width = X[1].height = 20
X[1]["stroke-width"] = 1.75
