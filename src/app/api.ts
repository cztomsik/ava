export const API_URL = `${window.location.protocol}//${window.location.host}/api`

type Query = PromiseLike<any> & { url: string }

const client = {
  request: async (method, url, data?, init?) => {
    const res = await fetch(`${API_URL}/${url}`, { method, body: data && JSON.stringify(data), ...init })
    const mime = res.headers.get("Content-Type")?.split(";")[0] ?? ""

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

  listChats: () => client.query("chat"),
  createChat: chat => client.post("chat", chat),
  getChat: id => client.query(`chat/${id}`),
  updateChat: chat => client.put(`chat/${chat.id}`, chat),
  deleteChat: id => client.delete(`chat/${id}`),

  listMessages: id => client.query(`chat/${id}/messages`),
  createMessage: (id, message) => client.post(`chat/${id}/messages`, message),
  getMessage: (id, message) => client.query(`chat/${id}/messages/${message.id}`),
  updateMessage: (id, message) => client.put(`chat/${id}/messages/${message.id}`, message),
  deleteMessage: (id, message) => client.delete(`chat/${id}/messages/${message.id}`),

  listModels: () => client.query("models"),
  createModel: model => client.post("models", model),
  deleteModel: id => client.delete(`models/${id}`),

  listPrompts: () => client.query("prompts"),
  createPrompt: prompt => client.post("prompts", prompt),
  deletePrompt: id => client.delete(`prompts/${id}`),

  getSystemInfo: () => client.query("system-info"),
  getLog: () => client.query("log"),
}
