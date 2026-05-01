import axios from 'axios'

// Production: use real backend URL. Dev: use proxy (vite.config.ts handles /api)
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 300000,
})

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('access')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

let refreshing = false
let queue: any[] = []

api.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status === 401 && !orig._retry) {
    if (refreshing) {
      return new Promise((res, rej) => queue.push({ res, rej }))
        .then(t => { orig.headers.Authorization = `Bearer ${t}`; return api(orig) })
    }
    orig._retry = true; refreshing = true
    const refresh = localStorage.getItem('refresh')
    if (!refresh) { window.location.href = '/login'; return Promise.reject(err) }
    try {
      const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh })
      localStorage.setItem('access', data.access)
      queue.forEach(p => p.res(data.access)); queue = []
      orig.headers.Authorization = `Bearer ${data.access}`
      return api(orig)
    } catch (e) {
      queue.forEach(p => p.rej(e)); queue = []
      localStorage.clear(); window.location.href = '/login'
      return Promise.reject(e)
    } finally { refreshing = false }
  }
  return Promise.reject(err)
})

export default api
