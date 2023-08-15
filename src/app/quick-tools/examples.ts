import { dedent } from "../_util"

export const examples = [
  {
    title: "Regex",
    description: "Regex tester",
    prompt: dedent`
      User: I need a help writing regular expression in JavaScript. Specifically, I want to write regex for {{whatToMatch}}...

      For example, the following should match:
      {{example1}}
      {{example2}}

      Only answer with regex and unit-tests.

      Assistant: You can use the following regular expression:
    `,
  },
]

console.log(examples)
