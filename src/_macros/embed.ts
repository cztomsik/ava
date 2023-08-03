import { isProduction } from "./env"

export const embedFile = async (path: string) => {
  const f = Bun.file(`${import.meta.dir}/../${path}`)

  return {
    basename: path.split("/").pop(),
    contentType: f.type,
    body: await f.text(),
  }
}

export const embedBundle = async (path: string) => {
  const { success, outputs, logs } = await Bun.build({
    entrypoints: [`${import.meta.dir}/../${path}`],
    minify: true,
  })

  if (!success) {
    throw new Error(logs.join("\n"))
  }

  return {
    basename: path.split("/").pop(),
    contentType: outputs[0].type,
    base64: btoa(await outputs[0].text()),
  }
}
