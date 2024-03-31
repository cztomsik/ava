/**
 * Template function to dedent a string by removing leading whitespace from each
 * line.
 */
export const dedent = (strings: TemplateStringsArray, ...values: any[]) => {
  let str = strings.reduce((prev, curr, i) => prev + values[i - 1] + curr)
  return str.trim().replace(/\n +/g, "\n")
}

/**
 * Humanize a string by replacing underscores with spaces and capitalizing the
 * first letter of each word.
 */
export const humanize = (str: string) =>
  str
    .replace(/_id$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase())

/**
 * Format a count to a human-readable string.
 */
export const fmtCount = (count: number) => {
  switch (true) {
    case count < 1_000:
      return count.toString()
    case count < 1_000_000:
      return `${(count / 1_000).toFixed(1)}K+`
    default:
      return `${(count / 1_000_000).toFixed(1)}M+`
  }
}

/**
 * Format a size in bytes to a human-readable string.
 */
export const fmtSize = size => {
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

/**
 * Format a duration in seconds to a human-readable string.
 */
export const fmtDuration = (duration: number) => {
  const timeUnits = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ] as const

  for (const [unit, value] of timeUnits) {
    if (duration >= value) {
      return (
        pluralize(Math.floor(duration / value), unit) + (duration % value === 0 ? "" : " " + fmtDuration(duration % value))
      )
    }
  }

  return pluralize(duration, "second")
}

/**
 * Format a date to a human-readable string.
 */
export const fmtDate = (date: number | string | Date) => {
  if (typeof date === "number" || typeof date === "string") date = new Date(date)
  return date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })
}

const pluralize = (count, noun, suffix = "s") => `${count} ${noun}${count !== 1 ? suffix : ""}`
