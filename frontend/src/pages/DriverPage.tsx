import { useState } from 'react'
import Navigation from '../components/Navigation'
import NFCScanner from '../components/NFCScanner'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { getStatusColor } from '../utils/statusColors'

interface ScannedShipment {
  tracking_number: string
  recipient_name: string
  destination_office_name: string
  status: string
  description: string | null
}

type DriverTab = 'nfc' | 'scan' | 'update'

const STATUSES = ['PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed', 'Returned'] as const
type DeliveryStatus = typeof STATUSES[number]

export default function DriverPage() {
  const [tab, setTab] = useState<DriverTab>('nfc')
  const [nfcLocation, setNfcLocation] = useState<string | null>(null)
  const [trackingInput, setTrackingInput] = useState('')
  const [shipment, setShipment] = useState<ScannedShipment | null>(null)
  const [loadingShipment, setLoadingShipment] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus>('PickedUp')
  const [notes, setNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleNFCSuccess = (data: { tag_id: string; location_name: string; expires_at: string }) => {
    setNfcLocation(data.location_name)
    toast.success(`Location verified: ${data.location_name}`)
    setTab('scan')
  }

  const lookupShipment = async (tracking: string) => {
    if (!tracking.trim()) return
    setLoadingShipment(true)
    setShipment(null)
    try {
      const res = await apiClient.get(`/shipments/${tracking.trim().toUpperCase()}`)
      setShipment(res.data)
    } catch (err: any) {
      toast.error(err.response?.status === 404 ? 'Shipment not found' : 'Lookup failed')
    } finally {
      setLoadingShipment(false)
    }
  }

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault()
    lookupShipment(trackingInput)
  }

  const handleStatusUpdate = async () => {
    if (!shipment) return
    setUpdating(true)
    try {
      await apiClient.put(`/shipments/${shipment.tracking_number}/status`, {
        status: selectedStatus,
        notes: notes.trim() || undefined,
        location: nfcLocation || undefined,
      })
      toast.success(`Status updated to ${selectedStatus}`)
      setShipment((prev) => prev ? { ...prev, status: selectedStatus } : null)
      setNotes('')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Driver Panel</h2>
        {nfcLocation && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800 text-sm font-medium">Location verified: <strong>{nfcLocation}</strong></p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { key: 'nfc', label: 'NFC Check-in' },
            { key: 'scan', label: 'Scan Package' },
            { key: 'update', label: 'Update Status' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as DriverTab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'nfc' && (
          <div>
            <p className="text-gray-600 mb-4">Scan the NFC tag at your pickup location to verify your position.</p>
            <NFCScanner onScanSuccess={handleNFCSuccess} onError={(e) => toast.error(e)} />
          </div>
        )}

        {tab === 'scan' && (
          <div className="space-y-4">
            {!nfcLocation && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Complete NFC check-in first to verify your location before updating statuses.
                </p>
              </div>
            )}
            <form onSubmit={handleManualLookup} className="flex gap-3">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Enter tracking number"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loadingShipment || !trackingInput.trim()}
                className="px-4 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingShipment ? '...' : 'Lookup'}
              </button>
            </form>

            {shipment && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{shipment.tracking_number}</p>
                    <p className="text-sm text-gray-600">To: {shipment.recipient_name}</p>
                    <p className="text-sm text-gray-600">{shipment.destination_office_name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(shipment.status)}`}>
                    {shipment.status}
                  </span>
                </div>
                <button
                  onClick={() => setTab('update')}
                  className="w-full py-2 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Update Status
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'update' && (
          <div className="space-y-4">
            {shipment ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="font-bold text-gray-900">{shipment.tracking_number}</p>
                  <p className="text-sm text-gray-600">To: {shipment.recipient_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">Current status:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(shipment.status)}`}>
                      {shipment.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedStatus(s)}
                        className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          selectedStatus === s
                            ? 'border-primary-blue bg-blue-50 text-primary-blue'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add delivery notes..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updating ? 'Updating...' : `Update to ${selectedStatus}`}
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No shipment selected.</p>
                <button
                  onClick={() => setTab('scan')}
                  className="mt-3 text-primary-blue hover:text-blue-700 font-medium"
                >
                  Go to Scan tab
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
