import { transformSync } from "esbuild"
import tsconfig from "../../../tsconfig.json" assert { type: "json" }

const extensions = ["ts", "tsx", "jsx"]

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier)
  } catch (e) {
    for (const ext of extensions) {
      try {
        return await nextResolve(`${specifier}.${ext}`)
      } catch (e) {}
    }
  }
}

export async function load(url, context, nextLoad) {
  const basename = url.split("/").pop()
  const extension = basename.split(".").pop()

  if (extensions.includes(extension)) {
    const { source } = await nextLoad(url, { format: "module" })
    const out = transformSync(source, {
      sourcefile: basename,
      loader: "tsx",
      tsconfigRaw: tsconfig,
    })

    return { format: "module", source: out.code }
  }

  return nextLoad(url)
}
