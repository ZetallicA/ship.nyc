import axios from 'axios'

const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl && envUrl !== 'http://localhost:8000/api') return envUrl

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const isHTTPS = protocol === 'https:'

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api'
    }
    // IP address or custom hostname — same host, port 8000
    return isHTTPS ? `https://${hostname}/api` : `http://${hostname}:8000/api`
  }

  return 'http://localhost:8000/api'
}

const apiClient = axios.create({ timeout: 15000 })

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiUrl()
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Error]', error.response?.status, error.config?.url, error.response?.data)
    }
    return Promise.reject(error)
  }
)

export default apiClient
