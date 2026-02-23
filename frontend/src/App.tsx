import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './hooks/useNotifications'
import { LoadingProvider } from './hooks/useLoading'
import ProtectedRoute from './router/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SendPage from './pages/SendPage'
import TrackPage from './pages/TrackPage'
import MailboxPage from './pages/MailboxPage'
import DriverPage from './pages/DriverPage'
import AdminPage from './pages/AdminPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <LoadingProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send"
                element={
                  <ProtectedRoute>
                    <SendPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/track" element={<TrackPage />} />
              <Route
                path="/mailbox"
                element={
                  <ProtectedRoute>
                    <MailboxPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver"
                element={
                  <ProtectedRoute role={['Driver', 'Admin', 'Supervisor']}>
                    <DriverPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role={['Admin', 'Supervisor']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#363636', color: '#fff' },
                success: { duration: 3000 },
                error: { duration: 5000 },
              }}
            />
          </LoadingProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
