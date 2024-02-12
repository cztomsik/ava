import { Select } from "../_components"
import { useApi } from "../_hooks"
import { dedent } from "../_util"

export const PromptSelect = ({ value, onChange }) => {
  const { data, loading } = useApi("prompts")

  const handleChange = e => {
    const id = +e.target.value
    const arr = id > 0 ? data : examples

    onChange(arr?.find(p => p.id === id))
  }

  return (
    <Select class="mb-2" value={value?.id ?? ""} onChange={handleChange}>
      <option value="">Load from ...</option>

      <optgroup label="Saved Prompts">
        {loading && <option>Loading ...</option>}

        {data?.map(({ id, name }) => (
          <option value={id}>{name}</option>
        ))}
      </optgroup>

      <optgroup label="Examples">
        {examples.map(({ id, name }, i) => (
          <option value={id}>{name}</option>
        ))}
      </optgroup>
    </Select>
  )
}

const examples = [
  {
    id: -1,
    name: "Story Writing",
    prompt: dedent`
      The following is an excerpt from a story about Bob, the cat, flying to space.
    `,
  },

  {
    id: -2,
    name: "Top 10 Movies To Watch",
    prompt: dedent`
      The top 10 movies to watch in 2025 are:
    `,
  },

  {
    id: -3,
    name: "Question Answering",
    prompt: dedent`
      Q: What is the capital of France?
      A: Paris.
      Q: {{question}}
      A:
    `,
  },

  // TODO: Writing technical documentation, product announcement, etc.
  {
    id: -4,
    name: "Copywriting",
    prompt: dedent`
      User needs help with copywriting.

      ASSISTANT: Hello.
      USER: Write a blog post{{#subject}} about {{subject}}{{/subject}}.
      ASSISTANT: Ok, here is a draft of the post.
    `,
  },
]
