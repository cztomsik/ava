import { dedent } from "../_util"

export const examples = [
  {
    title: "Correct Grammar",
    description: "Correct grammar",
    prompt:
      "User: I need to correct grammar in the following text:\n{{text}}\nAssistant: The correct grammar in the following text would be:",
  },

  {
    title: "Write an E-mail",
    description: "Write e-mail",
    prompt: "User: I need to write an e-mail to {{name}} about {{about}} because {{reason}}\nAssistant:",
  },

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
