'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

interface LoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Loading...')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [prevPathname, setPrevPathname] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  // Show loading during route changes
  useEffect(() => {
    // Set navigating state immediately when pathname changes
    if (prevPathname !== null && pathname !== prevPathname) {
      setIsNavigating(true)
      setIsLoading(true)
      setLoadingMessage('Loading page...')
    }
    
    // Update prevPathname
    setPrevPathname(pathname)
  }, [pathname, prevPathname])

  // Hide loading after page is ready
  useEffect(() => {
    if (isNavigating) {
      // Clear loading immediately when pathname changes (page is ready)
      // Don't wait for data - the page itself is loaded
      setIsLoading(false)
      setIsNavigating(false)
    }
  }, [pathname, searchParams, isNavigating])

  // Listen for link interactions to show loading immediately (before Next.js navigation)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href) {
        try {
          const url = new URL(link.href)
          const currentUrl = window.location
          
          // Only show loading for internal navigation
          if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
            // Show loading IMMEDIATELY on mousedown (before click event)
            // Set synchronously for instant feedback
            setIsLoading(true)
            setLoadingMessage('Loading page...')
          }
        } catch (err) {
          // Invalid URL, ignore
        }
      }
    }

    // Use mousedown (fires before click) and capture phase to intercept early
    // Capture phase ensures we catch it before Next.js Link handler
    document.addEventListener('mousedown', handleMouseDown, true)
    return () => document.removeEventListener('mousedown', handleMouseDown, true)
  }, [])

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setLoading: setIsLoading,
        loadingMessage,
        setLoadingMessage
      }}
    >
      {children}
      {isLoading && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center backdrop-blur-sm transition-opacity duration-200"
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 transform transition-all pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-blue absolute top-0 left-0"></div>
              </div>
              <p className="text-gray-900 font-semibold text-xl mt-6">{loadingMessage}</p>
              <p className="text-gray-500 text-sm mt-2">Please wait...</p>
              <div className="mt-4 w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-blue rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider')
  }
  return context
}

