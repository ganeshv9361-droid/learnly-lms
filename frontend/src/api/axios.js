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
  async error => {
    if (!error.response) {
      error.message = 'Server is waking up... Please wait 30 seconds and try again'
    }
    return Promise.reject(error)
  }
)

// Keep server alive — ping every 10 minutes
const keepAlive = () => {
  fetch('https://learnly-lms-hqch.onrender.com/')
    .catch(() => {})
}
setInterval(keepAlive, 10 * 60 * 1000)
keepAlive()

export default api