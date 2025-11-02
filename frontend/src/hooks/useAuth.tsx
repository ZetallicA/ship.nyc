'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/axios'
import Cookies from 'js-cookie'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginPIN: (email: string, pin: string) => Promise<void>
  register: (email: string, password: string, fullName: string, role: string, pin?: string) => Promise<void>
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

  const login = async (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const response = await apiClient.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    Cookies.set('token', response.data.access_token, { expires: 30 })
    await checkAuth()
    router.push('/dashboard')
  }

  const loginPIN = async (email: string, pin: string) => {
    const response = await apiClient.post('/auth/login-pin', {
      email,
      pin,
    })

    Cookies.set('token', response.data.access_token, { expires: 30 })
    await checkAuth()
    router.push('/dashboard')
  }

  const register = async (email: string, password: string, fullName: string, role: string, pin?: string) => {
    await apiClient.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      role,
      pin,
    })
    
    // Auto-login after registration (use PIN if provided, otherwise password)
    if (pin) {
      await loginPIN(email, pin)
    } else {
      await login(email, password)
    }
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginPIN, register, logout }}>
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

