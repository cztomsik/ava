import { useMemo } from "preact/hooks"
import { signal } from "@preact/signals"
import { Button, Table, Page, FormGrid } from "../_components"
import { useLocalStorage, useQuery } from "../_hooks"
import { fmtCount, fmtDate } from "../_util"
import { ModelsPage } from "./ModelsPage"
import { downloadModel } from "./download"

export const SearchModels = () => {
  const search = useLocalStorage("downloader.search", "")
  const { data: models = [], loading } = useQuery(searchModels(search.value))
  const selIndex = useMemo(() => signal(0), [models])
  const sel = models[selIndex.value] ?? null

  return (
    <ModelsPage>
      <Page.SubHead>
        <FormGrid>
          <label class="block mb-1 font-medium">Search</label>
          <input
            class="w-full p-2 mb-1"
            value={search}
            onInput={e => (search.value = e.currentTarget.value)}
            placeholder="Name or keyword"
          />
        </FormGrid>

        <div>
          Hint: Try searching for
          {["mistral", "mixtral", "starling", "zephyr", "westlake", "phi", "gemma", "rocket", "solar"].map(s => (
            <a href="#" onClick={() => (search.value = s)} class="ml-1 underline">
              {s}
            </a>
          ))}
        </div>
      </Page.SubHead>

      <Page.Content>
        <Table>
          <thead>
            <tr>
              <th>Model</th>
              <th class="w-32">Last updated</th>
              <th class="w-16">Likes</th>
              <th class="w-24">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {!models.length && (
              <tr>
                <td class="text-center" colSpan={4}>
                  {loading ? "Searching..." : "No matching models found."}
                </td>
              </tr>
            )}

            {models.map((m, i) => (
              <tr onClick={() => (selIndex.value = i)} class={i == selIndex.value ? "!bg-primary-10 text-white" : ""}>
                <td>{m.id}</td>
                <td>{fmtDate(m.lastModified)}</td>
                <td>{fmtCount(m.likes)}</td>
                <td>{fmtCount(m.downloads)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Page.Content>

      <Page.DetailsPane class="p-4" sizes={[300, 400, 700]}>
        {!sel && <div class="text-center">{loading ? "Loading..." : "Select a model to view details"}</div>}

        {sel && <ModelDetails model={sel} />}
      </Page.DetailsPane>
    </ModelsPage>
  )
}

const ModelDetails = ({ model }) => {
  const [author, name] = model.id.split("/")

  return (
    <div>
      <h2 class="text-neutral-10 text-sm uppercase font-medium mb-2">{name}</h2>
      {/* <Value label="Author" value={author} />
      <Value label="SHA" value={model.sha} />
      <Value label="Created" value={fmtDate(model.createdAt)} />

      {model.tags.length > 0 && <Value label="Tags" value={model.tags.join(", ")} />} */}

      <Button href={`https://huggingface.co/${model.id}`} target="_blank">
        View on Hugging Face
      </Button>

      <h2 class="text-neutral-10 text-sm uppercase font-medium mt-4 mb-2">GGUF files</h2>
      <table class="table-fixed w-full">
        <tr>
          <th>File</th>
          <th class="w-24"></th>
        </tr>

        {extractLinks(model).map(link => (
          <tr>
            <td>{link.name}</td>
            <td class="py-0.5">
              <Button onClick={() => downloadModel(link.url)}>Download</Button>
            </td>
          </tr>
        ))}
      </table>

      {/* <h2 class="text-neutral-10 text-sm uppercase font-medium mt-4 mb-2">Config</h2>
      <pre>{JSON.stringify(model.config, null, 2)}</pre> */}
    </div>
  )
}

let timeout

const searchModels = (search: string) => {
  const params = new URLSearchParams()
  params.set("search", ["gguf", search].join(" "))
  params.set("full", "true")
  // params.set("config", "true")
  params.set("sort", "downloads")
  params.set("direction", "-1")
  params.set("limit", "15")

  const url = `https://huggingface.co/api/models?${params.toString()}`

  return {
    url,
    fetch: () =>
      new Promise<any>((resolve, reject) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => fetch(url).then(r => resolve(r.json()), reject), 300)
      }),
  }
}

const extractLinks = model => {
  const res: { name; url }[] = []

  for (const s of model.siblings) {
    const match = s.rfilename.match(/.*[\.\-]([qf]\w+)\.gguf$/i)
    if (match) res.push({ name: match[1], url: `https://huggingface.co/${model.id}/resolve/main/${s.rfilename}` })
  }

  return res
}
