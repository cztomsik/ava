import { useEffect } from "preact/hooks"
import { useApi, selectedModel } from "../_hooks"

export const ModelSelect = ({ class: className = "" }) => {
  const { data: models, refetch } = useApi("models")
  const { value } = selectedModel

  useEffect(() => {
    if (models) {
      if (!selectedModel.value || !models.find(model => model.name === selectedModel.value)) {
        selectedModel.value = models[0]?.name
      }
    }
  }, [models])

  return (
    <select
      class={`form-select ${className}`}
      value={value}
      onClick={refetch}
      onChange={e => (selectedModel.value = e.target.value)}
    >
      {<option value={models?.length === 0 ? value : ""}>Select a model</option>}

      {models?.map(model => (
        <option key={model.name} value={model.name}>
          {model.name}
        </option>
      ))}
    </select>
  )
}
