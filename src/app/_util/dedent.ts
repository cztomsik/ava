export const dedent = (strings: TemplateStringsArray, ...values: any[]) => {
  let str = strings.reduce((prev, curr, i) => prev + values[i - 1] + curr)
  return str.trim().replace(/\n\s+/g, "\n")
}
