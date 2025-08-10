export const Value = ({ label, value }) => (
  <div class="vstack">
    <label class="text-neutral-11">{label}</label>
    <span>{value}</span>
  </div>
)

export const ValueExample = () => (
  <div class="flex gap-8">
    <Value label="Username" value="john.doe" />
    <Value label="Email" value="john@example.com" />
    <Value label="Role" value="Admin" />
    <Value label="Status" value="Active" />
  </div>
)
