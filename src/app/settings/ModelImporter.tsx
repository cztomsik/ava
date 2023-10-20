import { Alert, Button } from "../_components"
import { useApi, useLocalStorage } from "../_hooks"
import { useEffect } from "preact/hooks"
import { basename } from "../_util"

export const ModelImporter = () => {
  const { data: system } = useApi("system-info")
  const { data: models, post } = useApi("models")
  const path = useLocalStorage("importer.path", "")

  useEffect(() => {
    if (system && !path.value) path.value = system.user_downloads
  }, [system])

  const handleImport = async () => {
    // TODO: use getApiContext() but make sure the invalidate() does not do GET afterwards
    const res = await fetch("/api/find-models", { method: "POST", body: JSON.stringify(path.value) })
    const data = await res.json()

    // Import only models that are not already there
    for (const { path } of data) {
      if (!models?.find((m: any) => m.path === path)) {
        console.log(
          "Importing",
          path,
          models?.find((m: any) => m.path === path)
        )
        await post({ name: basename(path), path })
      }
    }
  }

  return (
    <Alert>
      <strong>Import models</strong>
      <p class="mb-3">If you already have some GGUF files, you can import them here:</p>
      <div class="hstack gap-2">
        <input class="flex-1 max-w-[500px]" value={path} onChange={e => (path.value = e.target!.value)} />
        <Button onClick={handleImport}>Import</Button>
      </div>
    </Alert>
  )
}
