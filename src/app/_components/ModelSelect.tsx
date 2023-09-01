import { useEffect } from "preact/hooks"
import { useApi, selectedModel } from "../_hooks"

export const ModelSelect = ({ class: className = "" }) => {
  const { data: models, loading } = useApi("models")

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
      value={selectedModel.value}
      onChange={e => (selectedModel.value = e.target.value)}
    >
      {loading && <option>Loading...</option>}

      {models?.map(model => (
        <option key={model.name} value={model.name}>
          {model.name}
        </option>
      ))}
    </select>
  )
}
