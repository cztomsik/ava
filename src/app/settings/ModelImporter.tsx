import { Alert, Button } from "../_components"
import { useQuery, useLocalStorage } from "../_hooks"
import { useMemo } from "preact/hooks"
import { basename } from "../_util"
import { api } from "../api"

export const ModelImporter = () => {
  const { data: models } = useQuery(api.listModels())
  const path = useLocalStorage("importer.path", "")

  useMemo(async () => {
    if (!path.value) path.value = (await api.getSystemInfo()).user_downloads
  }, [])

  const handleImport = async () => {
    // TODO: use getApiContext() but make sure the invalidate() does not do GET afterwards
    const res = await fetch("/api/find-models", { method: "POST", body: JSON.stringify({ path: path.value }) })
    const data = await res.json()

    // Import only models that are not already there
    for (const { path } of data) {
      if (!models?.find((m: any) => m.path === path)) {
        await api.createModel({ name: basename(path), path, imported: true })
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
