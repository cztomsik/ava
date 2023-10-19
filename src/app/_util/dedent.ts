/**
 * Template function to dedent a string by removing leading whitespace from each
 * line.
 */
export const dedent = (strings: TemplateStringsArray, ...values: any[]) => {
  let str = strings.reduce((prev, curr, i) => prev + values[i - 1] + curr)
  return str.trim().replace(/\n +/g, "\n")
}
