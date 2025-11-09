'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/axios'
import { useLoading } from '@/hooks/useLoading'

interface SearchResult {
  tracking_number: string
  recipient_name: string
  destination_office_name: string
  status: string
}

interface SearchBarProps {
  placeholder?: string
  onResultClick?: (trackingNumber: string) => void
  className?: string
}

export default function SearchBar({ 
  placeholder = 'Search by tracking number, recipient, or office...',
  onResultClick,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { setLoading: setGlobalLoading, setLoadingMessage } = useLoading()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch(query.trim())
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    setIsOpen(true)
    try {
      const response = await apiClient.get('/shipments', {
        params: { search: searchQuery }
      })
      setResults(response.data.slice(0, 5)) // Limit to 5 results
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (trackingNumber: string) => {
    setIsOpen(false)
    setQuery('')
    if (onResultClick) {
      onResultClick(trackingNumber)
    } else {
      // Show loading immediately before navigation
      setGlobalLoading(true)
      setLoadingMessage('Loading page...')
      router.push(`/track?tracking=${trackingNumber}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter' && results.length > 0) {
      handleResultClick(results[0].tracking_number)
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          aria-label="Search shipments"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-blue"></div>
          </div>
        )}
      </div>

      {isOpen && (results.length > 0 || query.length >= 2) && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={result.tracking_number}
                role="option"
                onClick={() => handleResultClick(result.tracking_number)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{result.tracking_number}</p>
                    <p className="text-sm text-gray-600">{result.recipient_name}</p>
                    <p className="text-xs text-gray-500">{result.destination_office_name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    result.status === 'InTransit' ? 'bg-purple-100 text-purple-700' :
                    result.status === 'PickedUp' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {result.status}
                  </span>
                </div>
              </button>
            ))
          ) : query.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  )
}

