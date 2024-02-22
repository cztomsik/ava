export const API_URL = `${window.location.protocol}//${window.location.host}/api`

const client = {
  request: async (method, url, data?, init?) => {
    const res = await fetch(`${API_URL}/${url}`, { method, body: data && JSON.stringify(data), ...init })

    return res.headers.get("Content-Type")?.startsWith("application/json") ? res.json() : res.text()
  },

  query: url => ({ url: `${API_URL}/${url}`, then: (resolve, reject) => client.get(url).then(resolve, reject) }),
  get: url => client.request("GET", url),
  post: (url, data) => client.request("POST", url, data),
  put: (url, data) => client.request("PUT", url, data),
  delete: url => client.request("DELETE", url),
}

export const api = {
  client,

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
