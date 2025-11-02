'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

function LogoutButton() {
  const { logout } = useAuth()
  return (
    <button
      onClick={logout}
      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
    >
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span className="text-gray-900">Logout</span>
    </button>
  )
}

interface NavigationProps {
  showBack?: boolean
  backUrl?: string
  title?: string
  subtitle?: string
}

export default function Navigation({ showBack = false, backUrl = '/dashboard', title, subtitle }: NavigationProps) {
  const { user } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBack && (
              <Link href={backUrl} className="mr-4">
                <svg className="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <Link href="/dashboard" className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-blue to-primary-purple rounded-lg shadow transform rotate-12"></div>
                <div className="absolute top-1 left-1 w-8 h-8 bg-primary-orange rounded-md"></div>
              </div>
              <span className="ml-3 text-2xl font-bold">
                <span className="text-primary-blue">Inter</span>
                <span className="text-primary-orange">Ship</span>
              </span>
            </Link>
            {title && (
              <div className="ml-4 border-l border-gray-300 pl-4">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              </div>
            )}
            {!title && user && (
              <div className="text-sm text-gray-600 ml-4">Welcome, {user.full_name}</div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {user.role === 'Admin' && (
                  <Link
                    href="/admin"
                    className="px-4 py-2 text-primary-blue hover:text-blue-700 font-medium"
                  >
                    Admin Panel
                  </Link>
                )}
                {user.role === 'Driver' && (
                  <Link
                    href="/driver"
                    className="px-4 py-2 text-primary-blue hover:text-blue-700 font-medium"
                  >
                    Driver View
                  </Link>
                )}
                <LogoutButton />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

