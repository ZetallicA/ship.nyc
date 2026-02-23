import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Navigation from '../components/Navigation'
import { useAuth } from '../hooks/useAuth'
import { useSavedRecipients } from '../hooks/useSavedRecipients'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

interface Office {
  id: string
  name: string
  address: string
}

interface ShipmentResult {
  tracking_number: string
  recipient_name: string
  destination_office_name: string
  status: string
  urgency: string
  created_at: string
}

type Step = 1 | 2 | 3 | 4

export default function SendPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { recipients: savedRecipients, saveRecipient } = useSavedRecipients()
  const [step, setStep] = useState<Step>(1)
  const [offices, setOffices] = useState<Office[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ShipmentResult | null>(null)
  const [saveRecipientChecked, setSaveRecipientChecked] = useState(false)

  const [form, setForm] = useState({
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    destination_office_id: '',
    description: '',
    weight_kg: '',
    urgency: 'Standard' as 'Standard' | 'Express' | 'Overnight',
    notes: '',
  })

  useEffect(() => {
    apiClient.get('/offices').then((res) => setOffices(res.data)).catch(() => {})
  }, [])

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const selectedOffice = offices.find((o) => o.id === form.destination_office_id)

  const fillFromSaved = (r: { name: string; officeId: string; officeName: string }) => {
    setForm((prev) => ({ ...prev, recipient_name: r.name, destination_office_id: r.officeId }))
  }

  const handleSubmit = async () => {
    if (!form.recipient_name.trim() || !form.destination_office_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        recipient_name: form.recipient_name.trim(),
        destination_office_id: form.destination_office_id,
        urgency: form.urgency,
      }
      if (form.recipient_email.trim()) payload.recipient_email = form.recipient_email.trim()
      if (form.recipient_phone.trim()) payload.recipient_phone = form.recipient_phone.trim()
      if (form.description.trim()) payload.description = form.description.trim()
      if (form.weight_kg) payload.weight_kg = parseFloat(form.weight_kg)
      if (form.notes.trim()) payload.notes = form.notes.trim()

      const res = await apiClient.post('/shipments', payload)
      setResult(res.data)

      if (saveRecipientChecked && selectedOffice) {
        saveRecipient(form.recipient_name.trim(), form.destination_office_id, selectedOffice.name)
      }

      setStep(4)
      toast.success('Shipment created!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create shipment')
    } finally {
      setSubmitting(false)
    }
  }

  const stepLabels = ['Recipient', 'Details', 'Review', 'Label']

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showBack backUrl="/dashboard" title="Send Package" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8">
            {stepLabels.slice(0, 3).map((label, idx) => {
              const stepNum = (idx + 1) as Step
              const active = step === stepNum
              const done = step > stepNum
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 flex-shrink-0 ${
                    done ? 'bg-green-500 border-green-500 text-white' :
                    active ? 'bg-primary-blue border-primary-blue text-white' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    {done ? '✓' : stepNum}
                  </div>
                  <span className={`ml-2 text-sm font-medium hidden sm:block ${active ? 'text-primary-blue' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {idx < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-3" />}
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recipient Information</h3>

              {savedRecipients.length > 0 && (
                <div className="mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saved Recipients</label>
                  <div className="flex gap-2 flex-wrap">
                    {savedRecipients.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => fillFromSaved(r)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-blue-50 hover:text-primary-blue transition-colors"
                      >
                        {r.name} ({r.officeName})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name *</label>
                <input
                  type="text"
                  value={form.recipient_name}
                  onChange={(e) => update('recipient_name', e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={form.recipient_email}
                  onChange={(e) => update('recipient_email', e.target.value)}
                  placeholder="optional@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Office *</label>
                <select
                  value={form.destination_office_id}
                  onChange={(e) => update('destination_office_id', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                >
                  <option value="">Select office</option>
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} — {o.address}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="saveRecipient"
                  checked={saveRecipientChecked}
                  onChange={(e) => setSaveRecipientChecked(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="saveRecipient" className="text-sm text-gray-600">Save recipient for quick fill next time</label>
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.recipient_name.trim() || !form.destination_office_id}
                className="w-full py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next: Package Details
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Package Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="What's in the package?"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={form.weight_kg}
                  onChange={(e) => update('weight_kg', e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Standard', 'Express', 'Overnight'] as const).map((u) => (
                    <button
                      key={u}
                      onClick={() => update('urgency', u)}
                      className={`py-3 rounded-xl border-2 font-medium text-sm transition-colors ${
                        form.urgency === u
                          ? 'border-primary-blue bg-blue-50 text-primary-blue'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Fragile, handle with care, etc."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipient</span>
                  <span className="font-medium text-gray-900">{form.recipient_name}</span>
                </div>
                {form.recipient_email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900">{form.recipient_email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Destination</span>
                  <span className="font-medium text-gray-900">{selectedOffice?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgency</span>
                  <span className="font-medium text-gray-900">{form.urgency}</span>
                </div>
                {form.weight_kg && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight</span>
                    <span className="font-medium text-gray-900">{form.weight_kg} kg</span>
                  </div>
                )}
                {form.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description</span>
                    <span className="font-medium text-gray-900">{form.description}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Sender</span>
                  <span className="font-medium text-gray-900">{user?.full_name}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Creating...' : 'Confirm & Send'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Shipment Created!</h3>
              <p className="text-gray-600 mb-4">Your tracking number is:</p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-2xl font-bold text-primary-blue tracking-wider">{result.tracking_number}</p>
              </div>

              {/* QR Code Label */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6 print:border-solid">
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={result.tracking_number} size={160} />
                </div>
                <p className="font-bold text-lg">{result.tracking_number}</p>
                <p className="text-gray-700">To: {result.recipient_name}</p>
                <p className="text-gray-600 text-sm">{result.destination_office_name}</p>
                <p className="text-xs text-gray-400 mt-2">{result.urgency}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Print Label
                </button>
                <button
                  onClick={() => navigate(`/track?tracking=${result.tracking_number}`)}
                  className="flex-1 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Track Package
                </button>
              </div>
              <button
                onClick={() => {
                  setStep(1)
                  setResult(null)
                  setForm({
                    recipient_name: '', recipient_email: '', recipient_phone: '',
                    destination_office_id: '', description: '', weight_kg: '',
                    urgency: 'Standard', notes: '',
                  })
                }}
                className="mt-3 w-full py-3 text-primary-blue hover:text-blue-700 font-medium transition-colors"
              >
                Send Another Package
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
