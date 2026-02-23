import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import SearchBar from './SearchBar'
import NotificationBell from './NotificationBell'

function LogoutButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label="Logout"
      className={`flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 w-full justify-center ${className}`}
    >
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="text-gray-900 font-medium">Logout</span>
    </button>
  )
}

interface NavigationProps {
  showBack?: boolean
  backUrl?: string
  title?: string
  subtitle?: string
  showSearch?: boolean
}

export default function Navigation({ showBack = false, backUrl = '/dashboard', title, subtitle, showSearch = false }: NavigationProps) {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [mobileMenuOpen])

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            {showBack && (
              <Link to={backUrl} aria-label="Go back" className="mr-2 sm:mr-4 flex-shrink-0">
                <svg className="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <Link to="/dashboard" className="flex items-center flex-shrink-0" aria-label="OATH Logistics Home">
              <img
                src="/oath-logo.png"
                alt="OATH Logistics"
                className="h-12 sm:h-16 w-auto"
                style={{ maxHeight: '80px' }}
              />
              <span className="ml-2 sm:ml-3 text-xl sm:text-2xl font-bold text-gray-900">
                OATH Logistics
              </span>
            </Link>
            {title && (
              <div className="ml-2 sm:ml-4 border-l border-gray-300 pl-2 sm:pl-4 hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-gray-600 truncate">{subtitle}</p>}
              </div>
            )}
            {!title && user && (
              <div className="text-xs sm:text-sm text-gray-600 ml-2 sm:ml-4 hidden sm:block">Welcome, {user.full_name}</div>
            )}
            {showSearch && (
              <div className="ml-2 sm:ml-4 flex-1 max-w-md hidden md:block">
                <SearchBar />
              </div>
            )}
          </div>

          {/* Right side - Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {user && (
              <>
                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    aria-label="Admin Panel"
                    className="px-4 py-2 text-primary-blue hover:text-blue-700 font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
                {user.role === 'Driver' && (
                  <Link
                    to="/driver"
                    aria-label="Driver View"
                    className="px-4 py-2 text-primary-blue hover:text-blue-700 font-medium"
                  >
                    Driver View
                  </Link>
                )}
                <Link
                  to="/settings"
                  aria-label="Settings"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Settings</span>
                </Link>
                <NotificationBell />
                <LogoutButton onClick={logout} />
              </>
            )}
          </div>

          {/* Mobile - Hamburger Menu Button */}
          {user && (
            <div className="lg:hidden relative" ref={menuRef}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue rounded-lg"
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
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2">
                  {showSearch && (
                    <div className="px-4 pb-3 border-b border-gray-200 md:hidden">
                      <SearchBar />
                    </div>
                  )}

                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-600">{user.role}</p>
                  </div>

                  <div className="py-2">
                    {user.role === 'Admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="font-medium">Admin Panel</span>
                      </Link>
                    )}
                    {user.role === 'Driver' && (
                      <Link
                        to="/driver"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-5 h-5 text-primary-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Driver View</span>
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Settings</span>
                    </Link>
                    <div className="px-4 py-2">
                      <NotificationBell />
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-gray-200">
                    <LogoutButton onClick={() => { logout(); setMobileMenuOpen(false) }} />
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
