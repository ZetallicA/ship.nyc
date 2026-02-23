import { useState, createContext, useContext, ReactNode } from 'react'

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

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading, loadingMessage, setLoadingMessage }}>
      {children}
      {isLoading && (
        <div
          className="fixed inset-0 bg-gray-50 bg-opacity-95 z-[9999] flex items-center justify-center backdrop-blur-sm"
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-blue absolute top-0 left-0"></div>
              </div>
              <p className="text-gray-900 font-semibold text-xl mt-6">{loadingMessage}</p>
              <p className="text-gray-500 text-sm mt-2">Please wait...</p>
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
