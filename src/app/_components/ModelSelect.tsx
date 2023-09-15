import { useEffect } from "preact/hooks"
import { Select } from "."
import { useApi, selectedModel } from "../_hooks"

export const ModelSelect = ({ class: className = "" }) => {
  const { data: models, refetch } = useApi("models")

  useEffect(() => {
    if (models) {
      if (!selectedModel.value || !models.find(model => model.name === selectedModel.value)) {
        selectedModel.value = models[0]?.name
      }
    }
  }, [models])

  return (
    <Select
      class={className}
      value={selectedModel.value}
      // onClick doesn't work in Safari
      onMouseDown={refetch}
      onChange={e => (selectedModel.value = e.target.value)}
    >
      {<option value={models?.length === 0 ? selectedModel.value : ""}>Select a model</option>}

      {models?.map(model => (
        <option key={model.name} value={model.name}>
          {model.name}
        </option>
      ))}
    </Select>
  )
}
