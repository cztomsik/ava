export const parseHTML = (input: string, clean = false) => {
  const doc = new DOMParser().parseFromString(input, "text/html")

  if (clean) {
    // Strip out scripts, styles and javascript links
    doc.querySelectorAll("script, link, style, a[href^='javascript:']").forEach(el => el.remove())

    // Remove style attribute
    doc.querySelectorAll("[style]").forEach(el => el.removeAttribute("style"))

    // Then for all elements (but in reverse)
    Array.from(doc.querySelectorAll("*"))
      .reverse()
      .forEach(el => {
        // Remove all data-* attributes
        for (const k of el.getAttributeNames()) {
          if (k.startsWith("data-")) el.removeAttribute(k)
        }

        // Remove if empty
        if (!el.innerHTML.trim()) el.remove()
      })
  }

  return doc
}
