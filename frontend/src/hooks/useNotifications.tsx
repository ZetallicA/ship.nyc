import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from 'react'

export interface Notification {
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('notifications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })))
      } catch (e) {
        console.error('Failed to load notifications:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications))
    }
  }, [notifications])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50))
  }, [])

  // WebSocket for real-time status updates
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const apiUrl = import.meta.env.VITE_API_URL || ''
    let wsBase: string
    if (apiUrl) {
      wsBase = apiUrl.replace(/^https?/, (m: string) => (m === 'https' ? 'wss' : 'ws'))
    } else {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsBase = `${proto}//${window.location.hostname}:8000`
    }

    try {
      const ws = new WebSocket(`${wsBase}?token=${token}`)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'status_update') {
            addNotification({
              title: 'Shipment Update',
              message: `${data.tracking_number} is now ${data.status}`,
              type: 'info',
            })
          }
        } catch {
          // ignore malformed messages
        }
      }
    } catch {
      // WebSocket unavailable — notifications still work without real-time
    }

    return () => {
      wsRef.current?.close()
    }
  }, [addNotification])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, unreadCount, clearNotification }}>
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
