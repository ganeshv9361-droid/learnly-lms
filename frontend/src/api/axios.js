import axios from 'axios'

const api = axios.create({
  baseURL: 'https://learnly-lms-hqch.onrender.com/api',
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
      error.message = 'Server is waking up, please wait 30 seconds and try again'
    }
    return Promise.reject(error)
  }
)

export default api
