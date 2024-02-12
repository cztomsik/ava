import { Form, Field } from "../_components"

export const Variables = ({ variableNames, data, onChange }) => {
  return (
    <Form class="p-3" data={data} onChange={onChange} onSubmit={onChange}>
      <h3 class="mb-2 text-neutral-10 text-sm uppercase font-medium">Variables</h3>

      <div class="vstack gap-3">
        {variableNames.length == 0 && <div>No variables found in the prompt.</div>}

        {variableNames.map(name => (
          <div class="flex">
            <div class="p-[5px] px-3 bg-neutral-2 border(1 neutral-8 r-0) rounded-l-md">{name}</div>
            <Field name={name} class="w-full !rounded-none !rounded-r-md" />
          </div>
        ))}
      </div>
    </Form>
  )
}
