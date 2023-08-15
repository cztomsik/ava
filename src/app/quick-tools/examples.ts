import { dedent } from "../_util"

export const examples = [
  {
    title: "Grammar Police",
    description: "Correct grammar in the provided text",
    prompt: dedent`
      User: Correct grammar in the following text:
      {{text}}
      Assistant: The correct grammar in the following text would be:
    `,
  },

  {
    title: "Vacation Planner",
    description: "Plan a vacation",
    prompt: dedent`
      User: I need a help with planning a vacation to {{destination}}. I want to go there for {{days}} days. I want to go there in {{month}}. My budget is {{budget}} dollars. {{extra}}
      Assistant: Here is the plan for your vacation:
    `,
  },

  {
    title: "Writing Style",
    description: "Suggest style improvements",
    prompt: dedent`
      User: Given the following text, suggest improvements to the style:
      {{text}}
      Assistant: The following improvements can be made: 
    `,
  },

  {
    title: "Interview Prep",
    description: "Prepare for an interview",
    prompt: dedent`
      User: I need to prepare for an interview for a {{position}} position at {{company}}. The company industry is {{industry}}.
      Assistant: Here are the questions you should prepare for:
    `,
  },

  {
    title: "Write an E-mail",
    description: "Write e-mail",
    prompt: dedent`
      User: I need to write an e-mail to {{name}} about {{about}} because {{reason}}\nAssistant:
    `,
  },

  {
    title: "Write a Reply",
    description: "Write e-mail reply",
    prompt: dedent`
      User: I got this email from {{name}}:
      {{email}}
      Rephrase this reply in a more polite way:
      {{reply}}
      Assistant: I think you could write something like this:
    `,
  },

  {
    title: "Summarize",
    description: "Summarize text",
    prompt: dedent`
      User: I need to summarize the following text:
      {{text}}
      Assistant: Here is the short summary as requested:
    `,
  },

  {
    title: "Buy or Sell",
    description: "Stock market advice",
    prompt: dedent`
      User: Given the following text about a stock, should I buy or sell?
      {{text}}
      Assistant: Based on the given text, it is difficult to provide a definitive answer. However, given that investor's risk tolerance is high, I would suggest
    `,
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

  {
    title: "Reimplement in Language X",
    description: "Reimplement in Language X",
    prompt: dedent`
      User: I need to reimplement the following code in {{language}}:
      {{code}}
      Assistant: Here is the code in {{language}}:
    `,
  },
]

console.log(examples)
