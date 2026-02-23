import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import SearchBar from './SearchBar'
import NotificationBell from './NotificationBell'

interface NavigationProps {
  showBack?: boolean
  backUrl?: string
  title?: string
  subtitle?: string
  showSearch?: boolean
}

export default function Navigation({ showBack = false, backUrl = '/', title, subtitle, showSearch = false }: NavigationProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen])

  return (
    <header className="bg-oath-blue shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left — logo + title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {showBack && (
              <Link to={backUrl} aria-label="Go back" className="flex-shrink-0 mr-1">
                <svg className="w-6 h-6 text-blue-300 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <Link to="/" className="flex items-center flex-shrink-0" aria-label="OATH Logistics Home">
              <img src="/oath-logo.png" alt="OATH Logistics" className="h-10 sm:h-12 w-auto" />
              <div className="ml-3 hidden sm:block">
                <span className="text-white text-lg font-bold block leading-tight">OATH Logistics</span>
                {title
                  ? <span className="text-blue-300 text-xs">{title}{subtitle ? ` — ${subtitle}` : ''}</span>
                  : <span className="text-blue-300 text-xs">Office Mail &amp; Delivery</span>
                }
              </div>
            </Link>
            {showSearch && (
              <div className="ml-4 flex-1 max-w-md hidden md:block">
                <SearchBar />
              </div>
            )}
          </div>

          {/* Right — desktop nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {user && (
              <>
                <Link to="/kiosk" className="px-3 py-2 text-blue-200 hover:text-white hover:bg-oath-secondary rounded-lg text-sm font-medium transition-colors">
                  Kiosk
                </Link>
                {(user.role === 'Driver' || user.role === 'Supervisor' || user.role === 'Admin') && (
                  <Link to="/driver" className="px-3 py-2 text-blue-200 hover:text-white hover:bg-oath-secondary rounded-lg text-sm font-medium transition-colors">
                    Driver
                  </Link>
                )}
                {(user.role === 'Admin' || user.role === 'Supervisor') && (
                  <Link to="/admin" className="px-3 py-2 text-blue-200 hover:text-white hover:bg-oath-secondary rounded-lg text-sm font-medium transition-colors">
                    Admin
                  </Link>
                )}
                <Link to="/display" className="px-3 py-2 text-blue-200 hover:text-white hover:bg-oath-secondary rounded-lg text-sm font-medium transition-colors">
                  Display
                </Link>
                <Link to="/settings" aria-label="Settings" className="px-3 py-2 text-blue-200 hover:text-white hover:bg-oath-secondary rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <NotificationBell />
                <div className="ml-1 flex items-center space-x-2 border-l border-blue-600 pl-3">
                  <div className="text-right hidden xl:block">
                    <p className="text-white text-sm font-medium leading-tight">{user.full_name}</p>
                    <span className="text-oath-gold text-xs font-semibold">{user.role}</span>
                  </div>
                  <button
                    onClick={logout}
                    aria-label="Logout"
                    className="px-3 py-2 border border-blue-500 text-blue-200 hover:text-white hover:border-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile — hamburger */}
          {user && (
            <div className="lg:hidden relative" ref={menuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
                className="p-2 text-blue-200 hover:text-white focus:outline-none rounded-lg"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-oath-blue border border-blue-600 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-blue-700">
                    <p className="text-white font-semibold text-sm">{user.full_name}</p>
                    <span className="text-oath-gold text-xs font-bold">{user.role}</span>
                  </div>
                  {showSearch && (
                    <div className="px-4 py-3 border-b border-blue-700 md:hidden">
                      <SearchBar />
                    </div>
                  )}
                  <div className="py-1">
                    {[
                      { to: '/kiosk', label: 'Mailroom Kiosk' },
                      ...(user.role === 'Driver' || user.role === 'Supervisor' || user.role === 'Admin'
                        ? [{ to: '/driver', label: 'Driver Console' }]
                        : []),
                      ...(user.role === 'Admin' || user.role === 'Supervisor'
                        ? [{ to: '/admin', label: 'Admin Panel' }]
                        : []),
                      { to: '/display', label: 'Live Display' },
                      { to: '/settings', label: 'Settings' },
                    ].map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block px-4 py-3 text-blue-100 hover:bg-oath-secondary hover:text-white text-sm font-medium transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-blue-700">
                    <NotificationBell />
                  </div>
                  <div className="px-4 py-3 border-t border-blue-700">
                    <button
                      onClick={() => { logout(); setMobileMenuOpen(false) }}
                      className="w-full py-2 text-blue-200 border border-blue-600 hover:text-white hover:border-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
