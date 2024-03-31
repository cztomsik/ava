import { Button, Table, ButtonGroup, Page, FormGrid } from "../_components"
import { ModelsPage } from "./ModelsPage"
import { useLocalStorage, useQuery } from "../_hooks"
import { fmtCount, fmtDate } from "../_util"
import { downloadModel } from "./download"

export const SearchModels = () => {
  const search = useLocalStorage("downloader.search", "")
  const { data: models = [], loading } = useQuery(searchModels(search.value))

  return (
    <ModelsPage>
      <Page.SubHead>
        <FormGrid>
          <label class="block mb-1">Search</label>
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
              <th class="w-24">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {!models.length && (
              <tr>
                <td colSpan={3}>{loading ? "Searching..." : "No matching models found."}</td>
              </tr>
            )}

            {models.map(m => (
              <tr>
                <td>
                  <a href={`https://huggingface.co/${m.id}`} target="_blank">
                    {m.id}
                  </a>
                  <br />
                </td>
                <td>{fmtDate(m.lastModified)}</td>
                <td>{fmtCount(m.downloads)}</td>
              </tr>
              /* <tr>
                <td colSpan={3}>
                  <ButtonGroup>
                    {extractLinks(m).map(link => (
                      <Button onClick={() => downloadModel(link.url)}>{link.name}</Button>
                    ))}
                  </ButtonGroup>
                </td>
              </tr> */
            ))}
          </tbody>
        </Table>
      </Page.Content>
    </ModelsPage>
  )
}

let timeout

const searchModels = (search: string) => {
  const params = new URLSearchParams()
  params.set("search", ["gguf", search].join(" "))
  params.set("full", "true")
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
