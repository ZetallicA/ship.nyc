import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'
import { getStatusColor } from '../utils/statusColors'

interface Shipment {
  id: string
  tracking_number: string
  recipient_name: string
  status: string
  urgency: string
  destination_office_name: string
  updated_at: string
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="text-right">
      <div className="text-white text-3xl font-mono font-bold tabular-nums">
        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-blue-300 text-sm">
        {now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}

const ACTIVE_STATUSES = ['Pending', 'PickedUp', 'InTransit', 'OutForDelivery']
const DONE_STATUSES = ['Delivered', 'Failed', 'Returned']

export default function DisplayPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)

  const fetchShipments = async () => {
    try {
      const res = await apiClient.get('/shipments', { params: { limit: 50 } })
      setShipments(res.data)
    } catch {
      // silently retry — display page should be resilient
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'shipment_update' || msg.type === 'shipment_created') {
          fetchShipments()
        }
      } catch {}
    }

    ws.onclose = () => {
      // attempt reconnect after 5s
      setTimeout(() => fetchShipments(), 5000)
    }

    // Refresh every 30s as a fallback
    const interval = setInterval(fetchShipments, 30000)

    return () => {
      ws.close()
      clearInterval(interval)
    }
  }, [])

  const active = shipments.filter((s) => ACTIVE_STATUSES.includes(s.status))
  const recent = shipments.filter((s) => DONE_STATUSES.includes(s.status)).slice(0, 20)

  const urgencyBadge = (u: string) => {
    if (u === 'Overnight') return 'bg-red-500 text-white'
    if (u === 'Express') return 'bg-oath-gold text-white'
    return 'bg-blue-700 text-blue-100'
  }

  return (
    <div className="min-h-screen bg-oath-blue flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-blue-700 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/oath-logo.png" alt="OATH" className="h-14 w-auto" />
          <div>
            <h1 className="text-white text-2xl font-bold">OATH Logistics</h1>
            <p className="text-blue-300 text-sm">Live Shipment Board</p>
          </div>
        </div>
        <Clock />
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — Active Shipments */}
        <div className="flex-1 border-r border-blue-700 flex flex-col overflow-hidden">
          <div className="bg-oath-secondary px-6 py-3 flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-oath-gold animate-pulse" />
            <h2 className="text-white font-bold text-lg tracking-widest uppercase">In Progress</h2>
            <span className="ml-auto bg-oath-blue text-oath-gold text-sm font-bold px-3 py-0.5 rounded-full">
              {active.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-blue-800 rounded-xl p-4 animate-pulse h-20" />
              ))
            ) : active.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-400 py-20">
                <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg">No active shipments</p>
              </div>
            ) : (
              active.map((s, i) => (
                <div
                  key={s.id}
                  className={`rounded-xl p-4 border transition-all ${
                    i === 0
                      ? 'bg-blue-800 border-oath-gold display-active-glow'
                      : 'bg-blue-800/60 border-blue-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-bold text-lg tracking-wider">{s.tracking_number}</p>
                      <p className="text-blue-300 text-sm truncate">{s.recipient_name}</p>
                      <p className="text-blue-400 text-xs truncate">{s.destination_office_name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>
                        {s.status}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencyBadge(s.urgency)}`}>
                        {s.urgency}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right — Recently Completed */}
        <div className="w-80 flex flex-col overflow-hidden">
          <div className="bg-green-900/40 px-6 py-3 flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <h2 className="text-white font-bold text-lg tracking-widest uppercase">Delivered</h2>
            <span className="ml-auto bg-oath-blue text-green-400 text-sm font-bold px-3 py-0.5 rounded-full">
              {recent.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {recent.length === 0 && !loading ? (
              <p className="text-blue-500 text-sm text-center py-8">No deliveries yet</p>
            ) : (
              recent.map((s) => (
                <div key={s.id} className="bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3">
                  <p className="text-white font-semibold text-sm tracking-wide">{s.tracking_number}</p>
                  <p className="text-blue-400 text-xs truncate">{s.recipient_name}</p>
                  <span className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${getStatusColor(s.status)}`}>
                    {s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer marquee */}
      <footer className="bg-oath-gold">
        <div className="marquee-container py-2">
          <span className="marquee-content text-white font-semibold text-sm px-8">
            OATH Logistics — Office Mail & Delivery Management &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            For assistance contact your supervisor &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
            OATH Office of Administrative Trials and Hearings
          </span>
        </div>
      </footer>
    </div>
  )
}
