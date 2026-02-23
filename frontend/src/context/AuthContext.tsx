import { useState, useEffect, createContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import type { User } from '../types'

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

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { checkAuth() }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }
    try {
      const res = await apiClient.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string, redirectUrl = '/dashboard') => {
    try {
      const res = await apiClient.post('/auth/login', { username, password })
      localStorage.setItem('token', res.data.access_token)
      await checkAuth()
      navigate(redirectUrl)
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
        throw new Error('Backend server is not responding. Please try again.')
      }
      throw error
    }
  }

  const loginPIN = async (id_number: string, pin: string, redirectUrl = '/dashboard') => {
    try {
      const res = await apiClient.post('/auth/login-pin', { id_number: id_number.trim(), pin: pin.trim() })
      localStorage.setItem('token', res.data.access_token)
      await checkAuth()
      navigate(redirectUrl)
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Login failed'
      throw new Error(msg)
    }
  }

  const register = async (username: string, password: string, fullName: string, role: string, email?: string) => {
    await apiClient.post('/auth/register', { username, password, full_name: fullName, role, ...(email ? { email } : {}) })
    await login(username, password)
  }

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    await apiClient.put('/auth/password', { current_password: currentPassword, new_password: newPassword })
  }

  const updatePIN = async (pin: string) => {
    await apiClient.put('/auth/pin', { pin })
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginPIN, register, updatePassword, updatePIN, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
