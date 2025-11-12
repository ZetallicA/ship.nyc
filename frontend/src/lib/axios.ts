import axios from 'axios'
import Cookies from 'js-cookie'

// Dynamically determine API URL based on current hostname
// This function will be called on each request to ensure it uses the current hostname
const getApiUrl = () => {
  // Check if we have an explicit API URL from environment
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== 'http://localhost:8000/api') {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // In the browser, construct from current hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const protocol = window.location.protocol // 'http:' or 'https:'
    const isHTTPS = protocol === 'https:'
    
    // Environment-based API URL configuration
    // Production: mail.oathone.com -> mailbackend.oathone.com
    // Dev/Stage: dev.mail.oathone.com -> dev.mailbackend.oathone.com
    if (hostname.includes('oathone.com')) {
      if (hostname === 'mail.oathone.com') {
        // Production environment
        return 'https://mailbackend.oathone.com/api'
      } else if (hostname === 'dev.mail.oathone.com') {
        // Dev/Stage environment
        return isHTTPS ? 'https://dev.mailbackend.oathone.com/api' : 'http://dev.mailbackend.oathone.com/api'
      } else {
        // Other oathone.com subdomains, use port-based access
        return isHTTPS ? `https://${hostname}:9443/api` : `http://${hostname}:8000/api`
      }
    }
    
    // If accessing via IP or localhost, use port-based access
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For localhost, use port 9443 for HTTPS, 8000 for HTTP
      return isHTTPS ? 'https://localhost:9443/api' : 'http://localhost:8000/api'
    } else if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      // IP address pattern - use port 9443 for HTTPS, 8000 for HTTP
      return isHTTPS ? `https://${hostname}:9443/api` : `http://${hostname}:8000/api`
    } else {
      // For other hostnames, use port 9443 for HTTPS, 8000 for HTTP
      return isHTTPS ? `https://${hostname}:9443/api` : `http://${hostname}:8000/api`
    }
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:8000/api'
}

// Create axios instance with a base URL getter
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  // We'll set baseURL dynamically in the request interceptor
})

// Add request interceptor to set baseURL dynamically and include token
apiClient.interceptors.request.use((config) => {
  // Always set baseURL dynamically for each request based on current hostname
  // This ensures it works correctly when accessing via IP vs localhost
  const apiUrl = getApiUrl()
  config.baseURL = apiUrl
  
  // Debug logging (helpful for troubleshooting)
  console.log(`[API Request] ${config.method?.toUpperCase()} ${apiUrl}${config.url || ''}`)
  
  // Add authentication token if available
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

// Health check function to wake up backend
const wakeUpBackend = async (apiUrl: string, retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const healthUrl = `${apiUrl}/health`
      const response = await axios.get(healthUrl, { timeout: 5000 })
      if (response.data?.status === 'healthy') {
        return true
      }
    } catch (err) {
      // Wait before retry with exponential backoff
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500))
      }
    }
  }
  return false
}

// Retry function with exponential backoff
const retryRequest = async (config: any, retries = 3): Promise<any> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await apiClient.request(config)
    } catch (error: any) {
      const isLastAttempt = attempt === retries - 1
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
      const isTimeout = error.code === 'ECONNABORTED'
      
      // Only retry on network errors or timeouts
      if (!isNetworkError && !isTimeout) {
        throw error
      }
      
      if (isLastAttempt) {
        throw error
      }
      
      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = Math.pow(2, attempt) * 500
      console.log(`[API] Retry attempt ${attempt + 1}/${retries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Try to wake up backend before retry
      if (attempt === 0 && config.baseURL) {
        console.log('[API] Backend may be sleeping, attempting to wake up...')
        await wakeUpBackend(config.baseURL, 2)
      }
    }
  }
  throw new Error('Max retries exceeded')
}

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Debug logging - show full error details
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', {
        message: error.message,
        code: error.code,
        name: error.name,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        fullError: error
      })
    }
    
    const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error'
    const isTimeout = error.code === 'ECONNABORTED'
    
    // If network error or timeout, try retry with wake-up
    if ((isNetworkError || isTimeout) && error.config && !error.config._retryAttempted) {
      error.config._retryAttempted = true
      
      // Try to wake up backend first
      if (error.config.baseURL) {
        console.log('[API] Backend may be sleeping, attempting to wake up...')
        const wokeUp = await wakeUpBackend(error.config.baseURL, 2)
        if (wokeUp) {
          console.log('[API] Backend is awake, retrying request...')
          // Retry the original request
          try {
            return await apiClient.request(error.config)
          } catch (retryError: any) {
            // If retry still fails, continue with fallback logic
            error = retryError
          }
        }
      }
    }
    
    // If network error, try fallback URLs
    if (isNetworkError || isTimeout) {
      const currentUrl = error.config?.baseURL || ''
      const hostname = window.location.hostname
      const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
      
      // Prevent infinite retry loops
      if (error.config._retryCount) {
        error.config._retryCount++
      } else {
        error.config._retryCount = 1
      }
      
      if (error.config._retryCount > 3) {
        console.error('[API] Max retries reached, giving up')
        // Enhance error message for user
        const enhancedError = new Error(
          'Backend server is not responding. The server may be starting up. Please wait a few seconds and try again.'
        )
        enhancedError.name = 'NetworkError'
        return Promise.reject(enhancedError)
      }
      
      // If trying mailbackend subdomain and it fails, log error (no fallback for Cloudflare tunnel)
      if (currentUrl.includes('mailbackend.oathone.com')) {
        console.error('[API] Backend subdomain failed. Check:')
        console.error('  1. Backend container is running: docker ps | grep backend')
        console.error('  2. Backend is accessible on port 9443: https://192.168.8.199:9443/api/health')
        console.error('  3. Cloudflare tunnel is running and routing mailbackend.oathone.com correctly')
        // Don't retry - Cloudflare tunnel is the only way to access backend
        const enhancedError = new Error(
          'Backend server is not responding. The server may be starting up. Please wait a few seconds and try again.'
        )
        enhancedError.name = 'NetworkError'
        return Promise.reject(enhancedError)
      }
      
      // If trying HTTPS and it fails, try HTTP
      if (currentUrl.startsWith('https://') && !currentUrl.includes('localhost')) {
        console.log('[API] HTTPS failed, trying HTTP...')
        const httpUrl = currentUrl.replace('https://', 'http://').replace(':9443', ':8000')
        error.config.baseURL = httpUrl
        return apiClient.request(error.config)
      }
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

