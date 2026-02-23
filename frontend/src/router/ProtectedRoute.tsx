import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Props {
  children: React.ReactNode
  role?: string | string[]
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (role) {
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(user.role)) return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
