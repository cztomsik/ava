import { useEffect } from "preact/hooks"
import { Select } from "./Select"
import { useApi, selectedModel } from "../_hooks"
import { router } from "../router"

export const ModelSelect = ({ class: className = "" }) => {
  const { data: models, refetch } = useApi("models")

  useEffect(() => {
    if (models) {
      if (!selectedModel.value || !models.find(model => model.name === selectedModel.value)) {
        selectedModel.value = models[0]?.name
      }
    }
  }, [models])

  const handleChange = e => {
    if (e.target.value === "/download") {
      e.target.value = selectedModel.value
      router.navigate("/settings")
      return
    }

    selectedModel.value = e.target.value
  }

  return (
    <Select
      class={className}
      value={selectedModel.value}
      // onClick doesn't work in Safari
      onMouseDown={refetch}
      onChange={handleChange}
    >
      <option value={models?.length === 0 ? selectedModel.value : ""}>Select a model...</option>
      <option value="/download">Download a model...</option>
      <hr />

      {models?.map(model => (
        <option key={model.name} value={model.name}>
          {model.name}
        </option>
      ))}
    </Select>
  )
}
