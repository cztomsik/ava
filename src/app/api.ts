export const API_URL = `${window.location.protocol}//${window.location.host}/api`

type Query = PromiseLike<any> & { url: string }

const client = {
  request: async (method, url, data?, init?) => {
    const res = await fetch(`${API_URL}/${url}`, { method, body: data && JSON.stringify(data), ...init })
    const mime = res.headers.get("Content-Type")?.split(";")[0] ?? ""

    if (!res.ok) {
      const err = new Error(`${res.status} ${res.statusText}`)
      err["response"] = await res.text()
      throw err
    }

    return mime === "application/json" ? res.json() : mime.startsWith("text/") ? res.text() : res
  },

  query: (url): Query => ({ url: `${API_URL}/${url}`, then: (resolve, reject) => client.get(url).then(resolve, reject) }),
  get: url => client.request("GET", url),
  post: (url, data, init?) => client.request("POST", url, data, init),
  put: (url, data) => client.request("PUT", url, data),
  delete: url => client.request("DELETE", url),
}

// TODO: $ grep "pub fn @\"" -rhI src/api | less
export const api = {
  client,

  generate: ({ signal, ...data }) => client.post("generate", data, { signal }),
  createCompletion: data => client.post("chat/completions", data),

  listChats: () => client.query("chat"),
  createChat: data => client.post("chat", data),
  getChat: id => client.query(`chat/${id}`),
  updateChat: (id, data) => client.put(`chat/${id}`, data),
  deleteChat: id => client.delete(`chat/${id}`),

  listMessages: chat_id => client.query(`chat/${chat_id}/messages`),
  createMessage: (chat_id, data) => client.post(`chat/${chat_id}/messages`, data),
  getMessage: (chat_id, id) => client.query(`chat/${chat_id}/messages/${id}`),
  updateMessage: (chat_id, id, data) => client.put(`chat/${chat_id}/messages/${id}`, data),
  deleteMessage: (chat_id, id) => client.delete(`chat/${chat_id}/messages/${id}`),

  listModels: () => client.query("models"),
  createModel: data => client.post("models", data),
  deleteModel: id => client.delete(`models/${id}`),

  listPrompts: () => client.query("prompts"),
  createPrompt: data => client.post("prompts", data),
  deletePrompt: id => client.delete(`prompts/${id}`),

  listQuickTools: () => client.query("quick-tools"),
  createQuickTool: data => client.post("quick-tools", data),
  getQuickTool: id => client.query(`quick-tools/${id}`),
  updateQuickTool: (id, data) => client.put(`quick-tools/${id}`, data),
  deleteQuickTool: id => client.delete(`quick-tools/${id}`),

  getSystemInfo: () => client.query("system-info"),
  getLog: () => client.query("log"),
}
