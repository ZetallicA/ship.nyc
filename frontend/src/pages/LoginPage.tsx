import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import PINPad from '../components/PINPad'
import toast from 'react-hot-toast'

type LoginMode = 'password' | 'pin'

export default function LoginPage() {
  const { user, login, loginPIN, loading } = useAuth()
  const [mode, setMode] = useState<LoginMode>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pinResetTrigger, setPinResetTrigger] = useState(0)

  if (user) return <Navigate to="/" replace />

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePINComplete = async (pin: string) => {
    if (!idNumber.trim()) {
      toast.error('Please enter your ID number')
      setPinResetTrigger((n) => n + 1)
      return
    }
    setSubmitting(true)
    try {
      await loginPIN(idNumber.trim(), pin)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid ID or PIN')
      setPinResetTrigger((n) => n + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/oath-logo.png" alt="OATH Logistics" className="h-16 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-gray-600 mt-1">OATH Logistics Portal</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setMode('password')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setMode('pin')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'pin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Driver PIN
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                disabled={submitting || loading}
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                disabled={submitting || loading}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || loading || !username.trim() || !password.trim()}
              className="w-full py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID Number</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                disabled={submitting}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">Enter your PIN below</p>
            <PINPad
              onPINComplete={handlePINComplete}
              disabled={submitting}
              resetTrigger={pinResetTrigger}
            />
          </div>
        )}

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-blue hover:text-blue-700 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
