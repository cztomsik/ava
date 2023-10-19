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
