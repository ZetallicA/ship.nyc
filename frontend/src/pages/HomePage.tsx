import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface Tile {
  to: string
  label: string
  sub: string
  icon: React.ReactNode
  accent: string // bg class
  roles?: string[]
}

const SendIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
)

const DisplayIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const DriverIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const AdminIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ALL_TILES: Tile[] = [
  {
    to: '/kiosk',
    label: 'Mailroom Kiosk',
    sub: 'Ship, track and manage packages',
    icon: <SendIcon />,
    accent: 'bg-oath-blue hover:bg-oath-secondary',
  },
  {
    to: '/display',
    label: 'Live Display',
    sub: 'Real-time shipment board',
    icon: <DisplayIcon />,
    accent: 'bg-oath-secondary hover:bg-oath-blue',
  },
  {
    to: '/driver',
    label: 'Driver Console',
    sub: 'Routes, deliveries and status updates',
    icon: <DriverIcon />,
    accent: 'bg-oath-blue hover:bg-oath-secondary',
    roles: ['Driver', 'Supervisor', 'Admin'],
  },
  {
    to: '/admin',
    label: 'Admin Panel',
    sub: 'Offices, users and reports',
    icon: <AdminIcon />,
    accent: 'bg-oath-secondary hover:bg-oath-blue',
    roles: ['Admin', 'Supervisor'],
  },
  {
    to: '/settings',
    label: 'My Settings',
    sub: 'Profile, password and notifications',
    icon: <SettingsIcon />,
    accent: 'bg-slate-600 hover:bg-slate-700',
  },
]

export default function HomePage() {
  const { user, logout } = useAuth()

  const tiles = ALL_TILES.filter(
    (t) => !t.roles || t.roles.includes(user?.role ?? '')
  )

  return (
    <div className="min-h-screen bg-oath-light-gray flex flex-col">
      {/* Header */}
      <header className="bg-oath-blue shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/oath-logo.png" alt="OATH" className="h-12 w-auto" />
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">OATH Logistics</h1>
              <p className="text-blue-200 text-xs">Office Mail & Delivery Portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-white font-medium text-sm">{user?.full_name}</p>
              <span className="inline-block bg-oath-gold text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <h2 className="text-2xl font-bold text-oath-blue mb-2">
          Welcome back, {user?.full_name?.split(' ')[0]}
        </h2>
        <p className="text-gray-500 mb-8">What would you like to do today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tiles.map((tile) => (
            <Link
              key={tile.to}
              to={tile.to}
              className={`${tile.accent} text-white rounded-2xl p-7 flex flex-col items-start shadow-md transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5`}
            >
              <div className="mb-4 opacity-90">{tile.icon}</div>
              <h3 className="text-lg font-bold mb-1">{tile.label}</h3>
              <p className="text-sm text-blue-100 leading-snug">{tile.sub}</p>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-oath-blue mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-blue-300 text-xs">© {new Date().getFullYear()} OATH — Office of Administrative Trials and Hearings</p>
          <div className="flex space-x-4">
            <Link to="/display" className="text-blue-300 hover:text-oath-gold text-xs transition-colors">Live Display</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
