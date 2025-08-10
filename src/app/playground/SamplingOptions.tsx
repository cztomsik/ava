import { FormGroup, Field, Slider, Checkbox } from "../_components"

export const SamplingOptions = ({ value, onChange }) => {
  return (
    <FormGroup class="p-3" value={value} onChange={onChange}>
      <h3 class="mb-2 text-neutral-10 text-sm uppercase font-medium">Sampling options</h3>

      <div class="vstack gap-3">
        <Field as={Slider} name="temperature" label="Temperature" min={0} max={2} step={0.01} />
        <Field as={Slider} name="top_k" label="Top K" min={1} max={100} />
        <Field as={Slider} name="top_p" label="Top P" min={0} max={1} step={0.01} />

        <Field as={Slider} name="repeat_n_last" label="Repeat N last" min={0} max={1024} />
        <Field as={Slider} name="repeat_penalty" label="Repeat penalty" min={0} max={2} step={0.01} />

        <Field as={Slider} name="presence_penalty" label="Presence penalty" min={0} max={2} step={0.01} />
        <Field as={Slider} name="frequency_penalty" label="Frequency penalty" min={0} max={2} step={0.01} />

        <Field as={Checkbox} name="add_bos" label="Add BOS token" />
        <Field as={Checkbox} name="json" label="Sample JSON" />
      </div>
    </FormGroup>
  )
}
