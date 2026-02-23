import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import PINPad from '../components/PINPad'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

type SettingsTab = 'profile' | 'security' | 'notifications'

interface NotifPrefs {
  emailEnabled: boolean
  smsEnabled: boolean
  notificationMethods: string[]
  statusUpdates: boolean
  deliveryAlerts: boolean
}

export default function SettingsPage() {
  const { user, updatePassword, updatePIN } = useAuth()
  const [tab, setTab] = useState<SettingsTab>('profile')

  // Profile
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Security - Password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPw, setSavingPw] = useState(false)

  // Security - PIN
  const [pinPhase, setPinPhase] = useState<'current' | 'new' | 'confirm'>('current')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinResetTrigger, setPinResetTrigger] = useState(0)
  const [hasPin, setHasPin] = useState(false)

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    emailEnabled: true,
    smsEnabled: false,
    notificationMethods: ['email'],
    statusUpdates: true,
    deliveryAlerts: true,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileForm({ full_name: user.full_name, email: user.email })
    }
    loadNotifPrefs()
    // Check if user has PIN (has id_number)
    if (user?.id_number) setHasPin(true)
  }, [user])

  const loadNotifPrefs = async () => {
    try {
      const res = await apiClient.get('/users/me/notification-preferences')
      if (res.data) {
        setNotifPrefs({
          emailEnabled: res.data.emailEnabled ?? true,
          smsEnabled: res.data.smsEnabled ?? false,
          notificationMethods: res.data.notificationMethods ?? ['email'],
          statusUpdates: res.data.statusUpdates ?? true,
          deliveryAlerts: res.data.deliveryAlerts ?? true,
        })
      }
    } catch {
      // silently fail
    }
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await apiClient.put(`/users/${user?.id}`, {
        full_name: profileForm.full_name.trim(),
        email: profileForm.email.trim(),
      })
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setSavingPw(true)
    try {
      await updatePassword(pwForm.currentPassword, pwForm.newPassword)
      toast.success('Password updated')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update password')
    } finally {
      setSavingPw(false)
    }
  }

  const handleCurrentPIN = (pin: string) => {
    setCurrentPin(pin)
    setPinPhase('new')
    setPinResetTrigger((n) => n + 1)
  }

  const handleNewPIN = (pin: string) => {
    setNewPin(pin)
    setPinPhase('confirm')
    setPinResetTrigger((n) => n + 1)
  }

  const handleConfirmPIN = async (pin: string) => {
    if (pin !== newPin) {
      toast.error('PINs do not match')
      setPinPhase('new')
      setNewPin('')
      setPinResetTrigger((n) => n + 1)
      return
    }
    try {
      await updatePIN(newPin)
      toast.success('PIN updated successfully')
      setPinPhase('current')
      setCurrentPin('')
      setNewPin('')
      setHasPin(true)
      setPinResetTrigger((n) => n + 1)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update PIN')
      setPinPhase('current')
      setCurrentPin('')
      setNewPin('')
      setPinResetTrigger((n) => n + 1)
    }
  }

  const handleNotifSave = async () => {
    setSavingNotifs(true)
    try {
      await apiClient.put('/users/me/notification-preferences', notifPrefs)
      toast.success('Notification preferences saved')
    } catch { toast.error('Failed to save preferences') }
    finally { setSavingNotifs(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'security', label: 'Security' },
            { key: 'notifications', label: 'Notifications' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as SettingsTab)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Profile Information</h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  disabled={savingProfile}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  disabled={savingProfile}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="space-y-6">
            {/* Password Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    disabled={savingPw}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    disabled={savingPw}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                    disabled={savingPw}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword}
                  className="w-full py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingPw ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* PIN Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Driver PIN</h3>
              <p className="text-sm text-gray-600 mb-4">
                {hasPin ? 'Update your 4-8 digit PIN for driver login' : 'Set up a PIN for quick driver login'}
              </p>

              {!user?.id_number ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-yellow-800 text-sm">
                    PIN login requires an ID number. Contact your administrator to have one assigned to your account.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      {pinPhase === 'current' && hasPin && 'Enter your current PIN'}
                      {pinPhase === 'current' && !hasPin && 'Enter your new PIN'}
                      {pinPhase === 'new' && 'Enter your new PIN'}
                      {pinPhase === 'confirm' && 'Confirm your new PIN'}
                    </p>
                  </div>
                  <PINPad
                    key={pinPhase}
                    onPINComplete={
                      pinPhase === 'current' ? (hasPin ? handleCurrentPIN : handleNewPIN) :
                      pinPhase === 'new' ? handleNewPIN :
                      handleConfirmPIN
                    }
                    resetTrigger={pinResetTrigger}
                    pinLength={6}
                  />
                  {pinPhase !== 'current' && (
                    <button
                      onClick={() => { setPinPhase('current'); setCurrentPin(''); setNewPin(''); setPinResetTrigger((n) => n + 1) }}
                      className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.emailEnabled}
                  onChange={(e) => setNotifPrefs((p) => ({ ...p, emailEnabled: e.target.checked }))}
                  className="w-5 h-5 rounded accent-primary-blue"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive text message alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.smsEnabled}
                  onChange={(e) => setNotifPrefs((p) => ({ ...p, smsEnabled: e.target.checked }))}
                  className="w-5 h-5 rounded accent-primary-blue"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Status Updates</p>
                  <p className="text-sm text-gray-600">Notify when shipment status changes</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.statusUpdates}
                  onChange={(e) => setNotifPrefs((p) => ({ ...p, statusUpdates: e.target.checked }))}
                  className="w-5 h-5 rounded accent-primary-blue"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Delivery Alerts</p>
                  <p className="text-sm text-gray-600">Notify on delivery and pickup</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.deliveryAlerts}
                  onChange={(e) => setNotifPrefs((p) => ({ ...p, deliveryAlerts: e.target.checked }))}
                  className="w-5 h-5 rounded accent-primary-blue"
                />
              </label>
              <button
                onClick={handleNotifSave}
                disabled={savingNotifs}
                className="w-full py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingNotifs ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
