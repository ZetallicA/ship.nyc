import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-blue-200 text-sm font-mono tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

const ACTIONS = [
  {
    to: '/send',
    label: 'Ship a Package',
    sub: 'Create a new shipment and print a label',
    icon: (
      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
      </svg>
    ),
    primary: true,
  },
  {
    to: '/track',
    label: 'Track a Package',
    sub: 'Look up status by tracking number',
    icon: (
      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    primary: false,
  },
  {
    to: '/mailbox',
    label: 'My Mailbox',
    sub: 'View packages assigned to you',
    icon: (
      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    primary: false,
  },
]

export default function KioskPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false))
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div className="min-h-screen bg-oath-light-gray flex flex-col">
      {/* Header */}
      <header className="bg-oath-blue shadow-md">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/oath-logo.png" alt="OATH" className="h-12 w-auto" />
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">OATH Logistics</h1>
              <p className="text-blue-200 text-xs">Mailroom Kiosk</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Clock />
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="text-blue-200 hover:text-white transition-colors p-1"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {user && (
          <div className="bg-oath-secondary px-6 py-2 flex items-center justify-between">
            <span className="text-blue-100 text-sm">
              Signed in as <span className="font-semibold text-white">{user.full_name}</span>
            </span>
            <button
              onClick={() => navigate('/')}
              className="text-blue-200 hover:text-white text-sm transition-colors"
            >
              ← Back to portal
            </button>
          </div>
        )}
      </header>

      {/* Main — large action cards */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-oath-blue mb-2 text-center">
          What would you like to do?
        </h2>
        <p className="text-gray-500 mb-10 text-center">Select an option to get started</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
          {ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`
                rounded-2xl p-8 flex flex-col items-center text-center shadow-md
                transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-95
                ${action.primary
                  ? 'bg-oath-blue text-white hover:bg-oath-secondary'
                  : 'bg-white border-2 border-gray-200 text-oath-blue hover:border-oath-blue hover:bg-blue-50'
                }
              `}
            >
              <div className={`mb-4 ${action.primary ? 'text-white' : 'text-oath-blue'}`}>
                {action.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{action.label}</h3>
              <p className={`text-sm leading-snug ${action.primary ? 'text-blue-200' : 'text-gray-500'}`}>
                {action.sub}
              </p>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-oath-blue">
        <div className="px-6 py-3 flex items-center justify-center">
          <p className="text-blue-300 text-xs">
            © {new Date().getFullYear()} OATH — Office of Administrative Trials and Hearings
          </p>
        </div>
      </footer>
    </div>
  )
}
