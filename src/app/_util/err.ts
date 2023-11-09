export const err = (...args) => {
  throw new Error(args.join(" "))
}
