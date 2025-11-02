import axios from 'axios'
import Cookies from 'js-cookie'

// Dynamically determine API URL based on current hostname
// This function will be called on each request to ensure it uses the current hostname
const getApiUrl = () => {
  // Check if we have an explicit API URL from environment
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // In the browser, construct from current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If accessing via IP, use IP for backend. Otherwise use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api'
    } else {
      // Use HTTP for backend (it's HTTP-only), but match the hostname
      return `http://${hostname}:8000/api`
    }
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:8000/api'
}

// Create axios instance with a base URL getter
const apiClient = axios.create({
  // We'll set baseURL dynamically in the request interceptor
})

// Add request interceptor to set baseURL dynamically and include token
apiClient.interceptors.request.use((config) => {
  // Always set baseURL dynamically for each request based on current hostname
  // This ensures it works correctly when accessing via IP vs localhost
  config.baseURL = getApiUrl()
  
  // Add authentication token if available
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

export default apiClient

