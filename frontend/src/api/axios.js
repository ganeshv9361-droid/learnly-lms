import axios from 'axios'

const BASE_URL = 'https://learnly-lms-hqch.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      error.message = 'Server waking up, please wait 30 seconds and retry'
    }
    return Promise.reject(error)
  }
)

export default api
