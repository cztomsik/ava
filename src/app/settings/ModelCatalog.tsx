import { Button, Table } from "../_components"
import { useQuery } from "../_hooks"
import { basename, fmtSize } from "../_util"
import { downloadModel } from "./download"
import { api } from "../api"

export const ModelCatalog = () => {
  const { data: models = [] } = useQuery(api.listModels())

  return (
    <>
      <h2 class="mt-10 mb-2 text-xl">Catalog</h2>
      <Table class="max-w-5xl">
        <thead>
          <tr>
            <th>Model</th>
            <th>Uploader</th>
            <th class="w-24 text-right">Size</th>
            <th class="w-32"></th>
          </tr>
        </thead>
        <tbody>
          {catalog.map(m => (
            <tr>
              <td class="capitalize">{basename(m.url.slice(0, -5))}</td>
              <td>{m.url.split("/")[3]}</td>
              <td class="text-right">{fmtSize(m.size)}</td>
              <td class="text-center">
                {models.find(({ name }) => name === basename(m.url).slice(0, -5)) ? (
                  <strong class="block py-1.5 text-green-10">Installed</strong>
                ) : (
                  <Button onClick={() => downloadModel(m)}>Download</Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <p class="mt-4">
        <strong>
          Different models may have different licenses. Always check the license of each model before using it.
        </strong>
      </p>
    </>
  )
}

const catalog = [
  {
    url: "https://huggingface.co/TheBloke/WizardLM-13B-V1.2-GGUF/resolve/main/wizardlm-13b-v1.2.Q4_K_M.gguf",
    size: 7865956224,
  },
  {
    url: "https://huggingface.co/TheBloke/MythoMax-L2-13B-GGUF/resolve/main/mythomax-l2-13b.Q4_K_M.gguf",
    size: 7865956224,
  },
  {
    url: "https://huggingface.co/TheBloke/zephyr-7B-beta-GGUF/resolve/main/zephyr-7b-beta.Q4_K_M.gguf",
    size: 4368438976,
  },
  {
    url: "https://huggingface.co/TheBloke/Airoboros-L2-7B-2.2-GGUF/resolve/main/airoboros-l2-7b-2.2.Q4_K_M.gguf",
    size: 4081004256,
  },
  {
    url: "https://huggingface.co/TheBloke/rocket-3B-GGUF/resolve/main/rocket-3b.Q4_K_M.gguf",
    size: 1708595136,
  },
]
