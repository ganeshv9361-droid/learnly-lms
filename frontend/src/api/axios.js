import axios from 'axios'

const BASE_URL = 'https://learnly-lms-hqch.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      error.message = 'Server is waking up, please wait 30 seconds and try again'
    }
    return Promise.reject(error)
  }
)

export default api