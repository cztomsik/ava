export const examples = [
  {
    id: 1,
    name: "Chuck Norris Jokes Explained",
    steps: [
      { http_request: { method: "GET", url: "https://api.chucknorris.io/jokes/random" } },
      { instruction: { instruction: "Extract the value part." } },
      { instruction: { instruction: "Explain the joke, reason step by step." } },
    ],
  },

  {
    id: 2,
    name: "Local Llama Top Posts",
    steps: [
      { http_request: { method: "GET", url: "https://old.reddit.com/r/LocalLLaMA/top/" } },
      { query_selector: { selector: ".thing" } },
      { instruction: { instruction: "Extract the title and url and respond with valid JSON." } },
    ],
  },

  {
    id: 3,
    name: "Scrape Hacker News Jobs",
    steps: [
      { wait: { duration: 2 } },
      { http_request: { method: "GET", url: "https://hn.svelte.dev/jobs/1" } },
      { query_selector: { selector: "main article", limit: 5 } },
      {
        instruction: {
          instruction: "Extract the job title, company and expected skills for the role. Respond with valid JSON.",
        },
      },
    ],
  },
]
