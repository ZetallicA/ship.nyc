import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import apiClient from '../api/client'
import toast from 'react-hot-toast'
import { formatRelative } from '../utils/format'
import { getStatusColor } from '../utils/statusColors'

type AdminTab = 'shipments' | 'offices' | 'users'

interface Shipment {
  id: string
  tracking_number: string
  recipient_name: string
  sender_name: string
  status: string
  urgency: string
  destination_office_name: string
  created_at: string
}

interface Office {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  lat?: number
  lng?: number
  is_active: boolean
}

interface User {
  id: string
  username: string
  full_name: string
  email: string
  role: string
  id_number: string | null
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('shipments')

  // Shipments
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [shipmentsLoading, setShipmentsLoading] = useState(false)
  const [shipmentSearch, setShipmentSearch] = useState('')

  // Offices
  const [offices, setOffices] = useState<Office[]>([])
  const [officesLoading, setOfficesLoading] = useState(false)
  const [showOfficeForm, setShowOfficeForm] = useState(false)
  const [editingOffice, setEditingOffice] = useState<Office | null>(null)
  const [officeForm, setOfficeForm] = useState({ name: '', address: '', city: '', state: '', zip_code: '' })

  // Users
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)

  useEffect(() => {
    if (tab === 'shipments') loadShipments()
    if (tab === 'offices') loadOffices()
    if (tab === 'users') loadUsers()
  }, [tab])

  const loadShipments = async () => {
    setShipmentsLoading(true)
    try {
      const res = await apiClient.get('/shipments')
      setShipments(res.data)
    } catch { toast.error('Failed to load shipments') }
    finally { setShipmentsLoading(false) }
  }

  const exportCSV = async () => {
    try {
      const res = await apiClient.get('/shipments/export', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `shipments-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Export failed') }
  }

  const loadOffices = async () => {
    setOfficesLoading(true)
    try {
      const res = await apiClient.get('/offices')
      setOffices(res.data)
    } catch { toast.error('Failed to load offices') }
    finally { setOfficesLoading(false) }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await apiClient.get('/users')
      setUsers(res.data)
    } catch { toast.error('Failed to load users') }
    finally { setUsersLoading(false) }
  }

  const handleOfficeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingOffice) {
        await apiClient.put(`/offices/${editingOffice.id}`, officeForm)
        toast.success('Office updated')
      } else {
        await apiClient.post('/offices', officeForm)
        toast.success('Office created')
      }
      setShowOfficeForm(false)
      setEditingOffice(null)
      setOfficeForm({ name: '', address: '', city: '', state: '', zip_code: '' })
      loadOffices()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save office')
    }
  }

  const deleteOffice = async (id: string) => {
    if (!confirm('Delete this office?')) return
    try {
      await apiClient.delete(`/offices/${id}`)
      toast.success('Office deleted')
      loadOffices()
    } catch { toast.error('Failed to delete office') }
  }

  const updateUserRole = async (userId: string, role: string) => {
    try {
      await apiClient.put(`/users/${userId}`, { role })
      toast.success('Role updated')
      loadUsers()
    } catch { toast.error('Failed to update role') }
  }

  const filteredShipments = shipments.filter((s) => {
    if (!shipmentSearch.trim()) return true
    const q = shipmentSearch.toLowerCase()
    return (
      s.tracking_number.toLowerCase().includes(q) ||
      s.recipient_name.toLowerCase().includes(q) ||
      s.sender_name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[
            { key: 'shipments', label: 'Shipments' },
            { key: 'offices', label: 'Offices' },
            { key: 'users', label: 'Users' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as AdminTab)}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Shipments Tab */}
        {tab === 'shipments' && (
          <div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <input
                type="text"
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                placeholder="Search shipments..."
                className="flex-1 min-w-48 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
              <button
                onClick={exportCSV}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>
            {shipmentsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Tracking</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Recipient</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Office</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredShipments.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-semibold text-primary-blue">{s.tracking_number}</td>
                          <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{s.recipient_name}</td>
                          <td className="px-4 py-3 text-gray-700 hidden md:table-cell">{s.destination_office_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(s.status)}`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatRelative(s.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredShipments.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No shipments found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offices Tab */}
        {tab === 'offices' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setShowOfficeForm(true); setEditingOffice(null); setOfficeForm({ name: '', address: '', city: '', state: '', zip_code: '' }) }}
                className="px-4 py-2 bg-primary-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                + Add Office
              </button>
            </div>

            {showOfficeForm && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">{editingOffice ? 'Edit Office' : 'New Office'}</h3>
                <form onSubmit={handleOfficeSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Office Name *</label>
                    <input type="text" value={officeForm.name} onChange={(e) => setOfficeForm((p) => ({ ...p, name: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <input type="text" value={officeForm.address} onChange={(e) => setOfficeForm((p) => ({ ...p, address: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input type="text" value={officeForm.city} onChange={(e) => setOfficeForm((p) => ({ ...p, city: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input type="text" value={officeForm.state} onChange={(e) => setOfficeForm((p) => ({ ...p, state: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input type="text" value={officeForm.zip_code} onChange={(e) => setOfficeForm((p) => ({ ...p, zip_code: e.target.value }))} required className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button type="submit" className="px-6 py-2 bg-primary-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
                      {editingOffice ? 'Save Changes' : 'Create Office'}
                    </button>
                    <button type="button" onClick={() => { setShowOfficeForm(false); setEditingOffice(null) }} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {officesLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-3">
                {offices.map((o) => (
                  <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{o.name}</p>
                      <p className="text-sm text-gray-600">{o.address}, {o.city}, {o.state} {o.zip_code}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingOffice(o); setOfficeForm({ name: o.name, address: o.address, city: o.city, state: o.state, zip_code: o.zip_code }); setShowOfficeForm(true) }}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteOffice(o.id)}
                        className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {offices.length === 0 && <div className="text-center py-8 text-gray-500">No offices yet</div>}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            {usersLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">User</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Role</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">ID Number</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{u.full_name}</p>
                            <p className="text-xs text-gray-500">@{u.username}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.email}</td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-blue"
                            >
                              <option value="User">User</option>
                              <option value="Driver">Driver</option>
                              <option value="Supervisor">Supervisor</option>
                              <option value="Admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                            {u.id_number || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && <div className="p-8 text-center text-gray-500">No users found</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
