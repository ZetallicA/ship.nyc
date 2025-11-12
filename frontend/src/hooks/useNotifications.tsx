'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import apiClient from '@/lib/axios'

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  unreadCount: number
  clearNotification: (id: string) => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications')
      const apiNotifications = response.data || []
      
      // Convert API notifications to local format
      const converted: Notification[] = apiNotifications.map((n: any) => ({
        id: n.id,
        type: n.title?.includes('Picked Up') ? 'info' : 
              n.title?.includes('Delivered') ? 'success' : 
              n.title?.includes('Created') ? 'success' : 'info',
        title: n.title || 'Notification',
        message: n.message || '',
        timestamp: new Date(n.created_at),
        read: n.read || false
      }))
      
      setNotifications(converted)
    } catch (error) {
      console.error('Failed to fetch notifications from API:', error)
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem('notifications')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })))
        } catch (e) {
          console.error('Failed to load notifications from localStorage:', e)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Save notifications to localStorage as backup
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep last 50
  }

  const markAsRead = async (id: string) => {
    // Optimistically update UI
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    
    // Update on backend
    try {
      await apiClient.put(`/notifications/${id}/read`)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Revert on error
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      )
    }
  }

  const markAllAsRead = async () => {
    // Optimistically update UI
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    
    // Update on backend
    try {
      await apiClient.put('/notifications/read-all')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        unreadCount,
        clearNotification,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

