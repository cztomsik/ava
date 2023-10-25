export const examples = [
  {
    id: 1,
    name: "Scrape Hacker News Jobs",
    steps: [
      { wait: { duration: 2 } },
      { http_request: { method: "GET", url: "https://news.ycombinator.com/jobs" } },
      { query_selector: { selector: "#hnmain > tbody > tr:nth-child(3) > td > table > tbody" } },
      { extract: { fields: ["title", "company", "url"] } },
      { for_each: { children: [] } },
    ],
  },
]
