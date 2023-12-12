import { Button, Checkbox, Field, Form, FormGrid, Modal, Range } from "../_components"

export const SettingsModal = ({ sampleOptions, onClose, onSave }) => {
  return (
    <Modal class="w-[20rem] md:w-[30rem]" title="Sampling Settings" onClose={onClose}>
      <Form data={sampleOptions} onSubmit={onSave}>
        <FormGrid class="grid-cols-1 md:grid-cols-[auto_auto] max-h-[30rem] overflow-auto">
          <Field as={Range} name="temperature" label="Temperature" min={0} max={2} step={0.01} />
          <Field as={Range} name="top_k" label="Top K" min={1} max={100} />
          <Field as={Range} name="top_p" label="Top P" min={0} max={1} step={0.01} />

          <Field as={Range} name="repeat_n_last" label="Repeat N last" min={0} max={1024} />
          <Field as={Range} name="repeat_penalty" label="Repeat penalty" min={0} max={2} step={0.01} />

          <Field as={Range} name="presence_penalty" label="Presence penalty" min={0} max={2} step={0.01} />
          <Field as={Range} name="freq_penalty" label="Frequency penalty" min={0} max={2} step={0.01} />

          <Field
            as={Checkbox}
            name="add_bos"
            label="Add beginning of string token"
            onChange={v => (sampleOptions.add_bos = v)}
          />
          <Field
            as={Checkbox}
            name="stop_eos"
            label="Stop at end of string token"
            onChange={v => (sampleOptions.stop_eos = v)}
          />
        </FormGrid>
        <div class="gap-2 flex justify-end">
          <Button onClick={onClose} text>
            Cancel
          </Button>
          <Button submit>Save</Button>
        </div>
      </Form>
    </Modal>
  )
}
