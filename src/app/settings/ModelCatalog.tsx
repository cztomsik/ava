import { Button, Table } from "../_components"
import { useApi } from "../_hooks"
import { basename, humanSize } from "../_util"
import { downloadModel } from "./download"

export const ModelCatalog = () => {
  const { data: models = [] } = useApi("models")

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
              <td class="text-right">{humanSize(m.size)}</td>
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
    url: "https://huggingface.co/TheBloke/Airoboros-L2-7B-2.2-GGUF/resolve/main/airoboros-l2-7b-2.2.Q4_K_M.gguf",
    size: 4081004256,
  },
  {
    url: "https://huggingface.co/Aryanne/Mamba-gpt-3B-v4-ggml-and-gguf/resolve/main/q4_0-gguf-mamba-gpt-3B_v4.gguf",
    size: 1979924096,
  },
  {
    url: "https://huggingface.co/Trelis/TinyLlama-1.1B-Chat-v0.1-GGUF/resolve/main/TinyLlama-1.1B-Chat-v0.1.Q4_K.gguf",
    size: 667817216,
  },
  {
    url: "https://huggingface.co/klosax/tinyllamas-stories-gguf/resolve/main/tinyllamas-stories-15m-f32.gguf",
    size: 98229216,
  },
]
