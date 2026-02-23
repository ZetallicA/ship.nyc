import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './hooks/useNotifications'
import { LoadingProvider } from './hooks/useLoading'
import ProtectedRoute from './router/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import KioskPage from './pages/KioskPage'
import DisplayPage from './pages/DisplayPage'
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
              {/* Portal hub */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />

              {/* Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Kiosk — touch-friendly launcher for ops staff */}
              <Route
                path="/kiosk"
                element={
                  <ProtectedRoute>
                    <KioskPage />
                  </ProtectedRoute>
                }
              />

              {/* Display — live shipment board, publicly accessible for office monitors */}
              <Route path="/display" element={<DisplayPage />} />

              {/* Shipment workflows */}
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

              {/* Staff views */}
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

              {/* Legacy redirect */}
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#1e3a5f', color: '#fff' },
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
