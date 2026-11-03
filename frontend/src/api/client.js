// Thin wrapper over fetch: the frontend never computes anything, it only calls the API.
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`);
  return data;
}

const user = (username) => `/users/${encodeURIComponent(username)}`;

export const api = {
  getDashboard: (username, { refresh = false } = {}) =>
    request(`${user(username)}/dashboard${refresh ? '?refresh=true' : ''}`),
  updateSettings: (username, settings) =>
    request(`${user(username)}/settings`, { method: 'PUT', body: settings }),
  createMatch: (username, jobDescription) =>
    request(`${user(username)}/match`, { method: 'POST', body: { jobDescription } }),
  chat: (username, question, history) =>
    request(`${user(username)}/chat`, { method: 'POST', body: { question, history } }),
  pitch: (username) => request(`${user(username)}/pitch`, { method: 'POST' }),
};
