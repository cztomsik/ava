/**
 * Template function to dedent a string by removing leading whitespace from each
 * line.
 */
export const dedent = (strings: TemplateStringsArray, ...values: any[]) => {
  let str = strings.reduce((prev, curr, i) => prev + values[i - 1] + curr)
  return str.trim().replace(/\n +/g, "\n")
}

/**
 * Returns a human readable identifier
 */
export const humanize = (str: string) =>
  str
    .replace(/_id$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase())

/**
 * Returns a human readable count
 */
export const humanCount = (count: number) => {
  switch (true) {
    case count < 1_000:
      return count.toString()
    case count < 1_000_000:
      return `${(count / 1_000).toFixed(1)}k`
    default:
      return `${(count / 1_000_000).toFixed(1)}m`
  }
}

/**
 * Returns a human readable size
 */
export const humanSize = size => {
  switch (true) {
    case size / 1024 < 1:
      return `${size} B`
    case size / 1024 / 1024 < 1:
      return `${(size / 1024).toFixed(2)} KB`
    case size / 1024 / 1024 / 1024 < 1:
      return `${(size / 1024 / 1024).toFixed(2)} MB`
    default:
      return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }
}

export const humanDuration = (duration: number) => {
  const timeUnits = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ] as const

  for (const [unit, value] of timeUnits) {
    if (duration >= value) {
      return (
        pluralize(Math.floor(duration / value), unit) + (duration % value === 0 ? "" : " " + humanDuration(duration % value))
      )
    }
  }

  return pluralize(duration, "second")
}

const pluralize = (count, noun, suffix = "s") => `${count} ${noun}${count !== 1 ? suffix : ""}`
