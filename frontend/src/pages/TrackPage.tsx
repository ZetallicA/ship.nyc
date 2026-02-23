import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../api/client'
import { formatDateTime } from '../utils/format'
import { getStatusColor } from '../utils/statusColors'

interface ShipmentEvent {
  id: string
  status: string
  notes: string | null
  location: string | null
  created_by_name: string
  created_at: string
}

interface Shipment {
  id: string
  tracking_number: string
  recipient_name: string
  recipient_email: string | null
  sender_name: string
  status: string
  urgency: string
  description: string | null
  weight_kg: number | null
  destination_office_name: string
  estimated_delivery: string | null
  created_at: string
  updated_at: string
}

export default function TrackPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('tracking') || '')
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [events, setEvents] = useState<ShipmentEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const tracking = searchParams.get('tracking')
    if (tracking) {
      setQuery(tracking)
      handleSearch(tracking)
    }
  }, [])

  const handleSearch = async (trackingNumber: string) => {
    const trimmed = trackingNumber.trim().toUpperCase()
    if (!trimmed) return

    setLoading(true)
    setError('')
    setShipment(null)
    setEvents([])

    try {
      const [shipRes, eventsRes] = await Promise.all([
        apiClient.get(`/shipments/${trimmed}`),
        apiClient.get(`/events/${trimmed}`),
      ])
      setShipment(shipRes.data)
      setEvents(eventsRes.data)
      setSearchParams({ tracking: trimmed })
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Shipment not found' : 'Failed to fetch shipment')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navigation />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="text-center mb-8">
            <Link to="/login">
              <img src="/oath-logo.png" alt="OATH Logistics" className="h-16 mx-auto mb-3" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Track your package</h1>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter tracking number (e.g. PKG-2024-00001)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {shipment && (
          <>
            {/* Shipment Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{shipment.tracking_number}</h2>
                  <p className="text-gray-600 mt-1">From {shipment.sender_name} to {shipment.recipient_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(shipment.status)}`}>
                  {shipment.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Destination</p>
                  <p className="font-medium text-gray-900">{shipment.destination_office_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Urgency</p>
                  <p className="font-medium text-gray-900">{shipment.urgency}</p>
                </div>
                {shipment.weight_kg && (
                  <div>
                    <p className="text-gray-500">Weight</p>
                    <p className="font-medium text-gray-900">{shipment.weight_kg} kg</p>
                  </div>
                )}
                {shipment.estimated_delivery && (
                  <div>
                    <p className="text-gray-500">Est. Delivery</p>
                    <p className="font-medium text-gray-900">{formatDateTime(shipment.estimated_delivery)}</p>
                  </div>
                )}
                {shipment.description && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Description</p>
                    <p className="font-medium text-gray-900">{shipment.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking History</h3>
              {events.length === 0 ? (
                <p className="text-gray-500">No events yet</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event, idx) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? 'bg-primary-blue' : 'bg-gray-300'}`} />
                        {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatDateTime(event.created_at)}</span>
                        </div>
                        {event.notes && <p className="text-sm text-gray-700 mt-1">{event.notes}</p>}
                        {event.location && <p className="text-xs text-gray-500 mt-0.5">📍 {event.location}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">by {event.created_by_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
