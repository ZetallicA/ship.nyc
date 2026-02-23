import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../api/client'
import { formatDateTime, formatRelative } from '../utils/format'
import { getStatusColor } from '../utils/statusColors'

interface Stats {
  total: number
  inTransit: number
  deliveredToday: number
  pendingPickup: number
}

interface Shipment {
  id: string
  tracking_number: string
  recipient_name: string
  status: string
  urgency: string
  created_at: string
  destination_office_name: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, shipmentsRes] = await Promise.all([
          apiClient.get('/stats'),
          apiClient.get('/shipments', { params: { limit: 5 } }),
        ])
        setStats(statsRes.data)
        setRecentShipments(shipmentsRes.data)
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showSearch />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name}
          </h2>
          <p className="text-gray-600 mt-1">Here's your logistics overview</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link
            to="/send"
            className="bg-primary-blue text-white rounded-xl p-4 flex flex-col items-center hover:bg-blue-700 transition-colors"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-semibold text-sm">Send Package</span>
          </Link>
          <Link
            to="/track"
            className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl p-4 flex flex-col items-center hover:border-primary-blue hover:text-primary-blue transition-colors"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="font-semibold text-sm">Track Package</span>
          </Link>
          <Link
            to="/mailbox"
            className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl p-4 flex flex-col items-center hover:border-primary-blue hover:text-primary-blue transition-colors"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-semibold text-sm">My Mailbox</span>
          </Link>
          {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
            <Link
              to="/admin"
              className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl p-4 flex flex-col items-center hover:border-primary-blue hover:text-primary-blue transition-colors"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-semibold text-sm">Admin Panel</span>
            </Link>
          )}
          {user?.role === 'Driver' && (
            <Link
              to="/driver"
              className="bg-white border-2 border-gray-200 text-gray-700 rounded-xl p-4 flex flex-col items-center hover:border-primary-blue hover:text-primary-blue transition-colors"
            >
              <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold text-sm">Driver View</span>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2 w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total Shipments</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-purple-600">{stats.inTransit}</div>
              <div className="text-sm text-gray-600 mt-1">In Transit</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-green-600">{stats.deliveredToday}</div>
              <div className="text-sm text-gray-600 mt-1">Delivered Today</div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingPickup}</div>
              <div className="text-sm text-gray-600 mt-1">Pending Pickup</div>
            </div>
          </div>
        )}

        {/* Recent Shipments */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Shipments</h3>
            <Link to="/mailbox" className="text-sm text-primary-blue hover:text-blue-700">View all</Link>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : recentShipments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="font-medium">No shipments yet</p>
              <Link to="/send" className="mt-4 inline-block text-primary-blue hover:text-blue-700">
                Send your first package
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentShipments.map((s) => (
                <Link
                  key={s.id}
                  to={`/track?tracking=${s.tracking_number}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{s.tracking_number}</p>
                    <p className="text-sm text-gray-600">{s.recipient_name} → {s.destination_office_name}</p>
                    <p className="text-xs text-gray-400">{formatRelative(s.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(s.status)}`}>
                    {s.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
