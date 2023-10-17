import { useEffect } from "preact/hooks"
import { Select } from "./Select"
import { useApi, selectedModel } from "../_hooks"
import { router } from "../router"

export const ModelSelect = ({ class: className = "" }) => {
  const { data: models } = useApi("models")

  useEffect(() => {
    if (models) {
      if (!selectedModel.value || !models.find(model => model.id === selectedModel.value)) {
        selectedModel.value = models[0]?.id
      }
    }
  }, [models])

  const handleChange = e => {
    if (e.target.value === "/download") {
      e.target.value = "" + (selectedModel.value ?? "")
      router.navigate("/settings")
      return
    }

    selectedModel.value = +e.target.value || null
  }

  return (
    <Select class={className} value={selectedModel.value ?? ""} onChange={handleChange}>
      <option value={models?.length === 0 ? "" + selectedModel.value : ""}>Select a model...</option>
      <option value="/download">Download a model...</option>
      <hr />

      {models?.map(model => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </Select>
  )
}
