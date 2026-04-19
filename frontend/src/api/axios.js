import axios from 'axios'

const BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8000/api'
  : `http://${window.location.hostname}:8000/api`

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
