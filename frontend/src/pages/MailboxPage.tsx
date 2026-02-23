import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import apiClient from '../api/client'
import { formatRelative } from '../utils/format'
import { getStatusColor } from '../utils/statusColors'

interface Shipment {
  id: string
  tracking_number: string
  recipient_name: string
  sender_name: string
  status: string
  urgency: string
  description: string | null
  destination_office_name: string
  created_at: string
}

type FilterStatus = 'all' | 'Pending' | 'InTransit' | 'PickedUp' | 'Delivered' | 'Returned'

export default function MailboxPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadShipments()
  }, [])

  const loadShipments = async () => {
    try {
      const res = await apiClient.get('/shipments/my')
      setShipments(res.data)
    } catch (err) {
      console.error('Failed to load shipments:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = shipments.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        s.tracking_number.toLowerCase().includes(q) ||
        s.recipient_name.toLowerCase().includes(q) ||
        s.sender_name.toLowerCase().includes(q) ||
        s.destination_office_name.toLowerCase().includes(q)
      )
    }
    return true
  })

  const statuses: FilterStatus[] = ['all', 'Pending', 'InTransit', 'PickedUp', 'Delivered', 'Returned']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Mailbox</h2>
            <p className="text-gray-600 mt-1">Your shipment history</p>
          </div>
          <Link
            to="/send"
            className="px-4 py-2 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            + Send Package
          </Link>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-primary-blue text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-blue hover:text-primary-blue'
              }`}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-48"></div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">No shipments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                to={`/track?tracking=${s.tracking_number}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-blue transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{s.tracking_number}</span>
                      {s.urgency !== 'Standard' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          {s.urgency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      From <strong>{s.sender_name}</strong> to <strong>{s.recipient_name}</strong>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {s.destination_office_name} · {formatRelative(s.created_at)}
                    </p>
                  </div>
                  <span className={`ml-3 flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(s.status)}`}>
                    {s.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
