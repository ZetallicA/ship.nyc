'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/axios'
import Cookies from 'js-cookie'

interface User {
  id: string
  username: string
  email?: string
  full_name: string
  role: string
  is_active: boolean
  id_number?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string, redirectUrl?: string) => Promise<void>
  loginPIN: (id_number: string, pin: string, redirectUrl?: string) => Promise<void>
  register: (username: string, password: string, fullName: string, role: string, email?: string) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updatePIN: (pin: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = Cookies.get('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.get('/auth/me')
      setUser(response.data)
    } catch (error) {
      Cookies.remove('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string, redirectUrl: string = '/dashboard') => {
    try {
      // Wake up backend before login attempt
      try {
        const apiUrl = typeof window !== 'undefined' ? 
          (window.location.hostname === 'mail.oathone.com' ? 'https://mailbackend.oathone.com/api' : 
           window.location.protocol === 'https:' ? `https://${window.location.hostname}:9443/api` : 
           `http://${window.location.hostname}:8000/api`) : 
          'http://localhost:8000/api'
        
        await apiClient.get('/health', { timeout: 5000 }).catch(() => {
          // Health check failed, but continue with login attempt anyway
          console.log('[Auth] Health check failed, proceeding with login...')
        })
      } catch (healthError) {
        // Ignore health check errors, proceed with login
        console.log('[Auth] Health check error ignored, proceeding with login...')
      }
      
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      })

      Cookies.set('token', response.data.access_token, { expires: 30 })
      await checkAuth()
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push(redirectUrl)
    } catch (error: any) {
      // Enhance network error messages
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        throw new Error('Backend server is not responding. The server may be starting up. Please wait a few seconds and try again.')
      }
      throw error
    }
  }

  const loginPIN = async (id_number: string, pin: string, redirectUrl: string = '/dashboard') => {
    try {
      // Wake up backend before login attempt
      try {
        const apiUrl = typeof window !== 'undefined' ? 
          (window.location.hostname === 'mail.oathone.com' ? 'https://mailbackend.oathone.com/api' : 
           window.location.protocol === 'https:' ? `https://${window.location.hostname}:9443/api` : 
           `http://${window.location.hostname}:8000/api`) : 
          'http://localhost:8000/api'
        
        await apiClient.get('/health', { timeout: 5000 }).catch(() => {
          // Health check failed, but continue with login attempt anyway
          console.log('[Auth] Health check failed, proceeding with login...')
        })
      } catch (healthError) {
        // Ignore health check errors, proceed with login
        console.log('[Auth] Health check error ignored, proceeding with login...')
      }
      
      const response = await apiClient.post('/auth/login-pin', {
        id_number: id_number.trim(),
        pin: pin.trim(),
      })

      Cookies.set('token', response.data.access_token, { expires: 30 })
      await checkAuth()
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push(redirectUrl)
    } catch (error: any) {
      // Re-throw with better error message
      let errorMessage = error.response?.data?.detail || error.message || 'Login failed'
      
      // Enhance network error messages
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        errorMessage = 'Backend server is not responding. The server may be starting up. Please wait a few seconds and try again.'
      }
      
      throw new Error(errorMessage)
    }
  }

  const register = async (username: string, password: string, fullName: string, role: string, email?: string) => {
    const registerData: any = {
      username,
      password,
      full_name: fullName,
      role,
    }
    if (email) registerData.email = email

    await apiClient.post('/auth/register', registerData)
    
    // Auto-login after registration
    await login(username, password)
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    await apiClient.put('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  }

  const updatePIN = async (pin: string) => {
    await apiClient.put('/auth/pin', {
      pin,
    })
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginPIN, register, updatePassword, updatePIN, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

