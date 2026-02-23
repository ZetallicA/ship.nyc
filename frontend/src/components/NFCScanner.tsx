import { useState, useEffect, useRef } from 'react'
import apiClient from '../api/client'

interface NFCScannerProps {
  onScanSuccess: (scanData: {
    tag_id: string
    location_name: string
    expires_at: string
  }) => void
  onError?: (error: string) => void
  disabled?: boolean
}

interface NFCScanResponse {
  id: string
  tag_id: string
  driver_id: string
  driver_name: string
  scan_timestamp: string
  location_coordinates?: { lat: number; lng: number }
  location_name: string
  expires_at: string
}

export default function NFCScanner({ onScanSuccess, onError, disabled = false }: NFCScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [tagId, setTagId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanData, setScanData] = useState<NFCScanResponse | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check if Web NFC is available
  // Web NFC API is supported in Chrome on Android (Android 5.0+)
  // NOT supported in iOS Safari - iOS has NFC but not Web NFC API
  // Requires HTTPS (secure context)
  const isSecureContext = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
  const hasNFCNavigator = typeof window !== 'undefined' && 'nfc' in navigator
  const hasNDEFReader = typeof window !== 'undefined' && 'NDEFReader' in window
  const isNFCSupported = isSecureContext && hasNFCNavigator && hasNDEFReader
  
  // Detect iOS
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
  
  // Detect Chrome on Android
  const isChromeAndroid = typeof window !== 'undefined' && 
    /Android/.test(navigator.userAgent) && 
    /Chrome/.test(navigator.userAgent) &&
    !/Edg|OPR|Samsung/.test(navigator.userAgent)
  
  // Get browser info for troubleshooting
  const getBrowserInfo = () => {
    if (typeof window === 'undefined') return ''
    const ua = navigator.userAgent
    if (/Chrome/.test(ua) && !/Edg|OPR/.test(ua)) return 'Chrome'
    if (/Samsung/.test(ua)) return 'Samsung Internet'
    if (/Firefox/.test(ua)) return 'Firefox'
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari'
    return 'Unknown'
  }

  // Countdown timer
  useEffect(() => {
    if (scanData && scanData.expires_at) {
      const updateTimer = () => {
        const expires = new Date(scanData.expires_at)
        const now = new Date()
        const diff = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
        setTimeRemaining(diff)
        
        if (diff === 0) {
          setScanData(null)
          setTimeRemaining(null)
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      }
      
      updateTimer()
      intervalRef.current = setInterval(updateTimer, 1000)
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [scanData])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const scanWithWebNFC = async () => {
    if (!isNFCSupported) {
      setError('NFC is not supported on this device. Please use manual entry.')
      setManualMode(true)
      return
    }

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      // @ts-ignore - Web NFC API
      const reader = new NDEFReader()
      
      await reader.scan()
      
      reader.addEventListener('reading', async (event: any) => {
        try {
          const tagId = event.message.records[0]?.data
          if (tagId) {
            // Decode tag ID (assuming it's text)
            const decoder = new TextDecoder()
            const tagIdString = decoder.decode(tagId)
            await handleScanSubmit(tagIdString)
          }
        } catch (err: any) {
          setError(err.message || 'Failed to read NFC tag')
          setScanning(false)
        }
      })

      reader.addEventListener('readingerror', () => {
        setError('Failed to read NFC tag. Please try again or use manual entry.')
        setScanning(false)
      })

    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('NFC permission denied. Please enable NFC access in your browser settings.')
      } else if (err.name === 'NotSupportedError') {
        setError('NFC is not supported on this device. Please use manual entry.')
        setManualMode(true)
      } else {
        setError(err.message || 'Failed to start NFC scanner')
      }
      setScanning(false)
    }
  }

  const handleScanSubmit = async (tagIdValue: string) => {
    if (!tagIdValue.trim()) {
      setError('Please enter or scan an NFC tag ID')
      return
    }

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      // Get current location if available
      let coordinates: { lat: number; lng: number } | undefined
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }
      } catch (geoError) {
        // Location not available, continue without it
        console.log('Location not available:', geoError)
      }

      const response = await apiClient.post<NFCScanResponse>('/nfc/scan', {
        tag_id: tagIdValue.trim(),
        coordinates
      })

      setScanData(response.data)
      setSuccess(`Successfully scanned NFC tag at ${response.data.location_name}!`)
      setScanning(false)
      setManualMode(false)
      setTagId('')

      // Notify parent component
      onScanSuccess({
        tag_id: response.data.tag_id,
        location_name: response.data.location_name,
        expires_at: response.data.expires_at
      })

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to scan NFC tag'
      setError(errorMessage)
      setScanning(false)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleScanSubmit(tagId)
  }

  if (disabled) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-gray-600">NFC scanning is disabled</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
      {scanData ? (
        // Success state with countdown
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">NFC Tag Scanned!</h3>
          <p className="text-gray-700 mb-1">
            <strong>Location:</strong> {scanData.location_name}
          </p>
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">You can now scan packages</p>
              <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm font-medium text-blue-700">Time remaining:</span>
                <span className="text-lg font-bold text-blue-900">{formatTime(timeRemaining)}</span>
              </div>
            </div>
          )}
          {timeRemaining === 0 && (
            <p className="text-red-600 font-medium mt-4">Scan expired. Please scan again.</p>
          )}
        </div>
      ) : (
        // Scanning state
        <>
          {!manualMode ? (
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Step 1: Scan NFC Tag</h3>
              <p className="text-gray-600 mb-6">
                Hold your device near the NFC tag at the pickup location
              </p>
              
              {isNFCSupported ? (
                <button
                  onClick={scanWithWebNFC}
                  disabled={scanning}
                  className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                >
                  {scanning ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Scanning... Hold phone near tag</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Start NFC Scan</span>
                    </>
                  )}
                </button>
              ) : (
                <div className={`rounded-lg p-4 mb-4 ${isIOS ? 'bg-blue-50 border border-blue-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  {isIOS ? (
                    <>
                      <p className="font-semibold text-blue-900 mb-2">📱 iPhone Detected</p>
                      <p className="text-blue-800 mb-3 text-sm">
                        iOS Safari doesn't support Web NFC API. Please use manual entry below to enter the tag ID.
                      </p>
                      <p className="text-blue-700 text-xs mb-3">
                        <strong>Tip:</strong> You can read the tag ID using the NFC Tools app, then enter it manually here.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-yellow-800 mb-2 font-semibold">⚠️ NFC Not Available</p>
                      <div className="text-yellow-800 text-sm space-y-2 mb-3">
                        <p><strong>Detected:</strong> {getBrowserInfo()} browser on Android</p>
                        {!isSecureContext && (
                          <p className="text-red-700 font-medium">
                            ❌ Page must be served over HTTPS (secure connection)
                          </p>
                        )}
                        {isSecureContext && !isChromeAndroid && (
                          <p className="font-medium">
                            ⚠️ Web NFC requires <strong>Google Chrome</strong> browser (not Samsung Internet or other browsers)
                          </p>
                        )}
                        {isChromeAndroid && !hasNDEFReader && (
                          <div className="space-y-1">
                            <p className="font-medium">Possible issues:</p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Chrome version may be too old (update Chrome from Play Store)</li>
                              <li>NFC may be disabled in phone settings</li>
                              <li>Page may not be served over HTTPS</li>
                            </ul>
                          </div>
                        )}
                        {isChromeAndroid && hasNDEFReader && !hasNFCNavigator && (
                          <p className="font-medium">
                            NFC hardware may be disabled. Check Settings → Connections → NFC
                          </p>
                        )}
                      </div>
                      <div className="bg-white rounded p-3 mb-3 text-xs text-gray-700">
                        <p className="font-semibold mb-1">Quick Fixes:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Make sure you're using <strong>Google Chrome</strong> (not Samsung Internet)</li>
                          <li>Check that NFC is enabled: Settings → Connections → NFC</li>
                          <li>Update Chrome from Google Play Store</li>
                          <li>Ensure the page URL starts with <code className="bg-gray-100 px-1 rounded">https://</code></li>
                        </ol>
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => setManualMode(true)}
                    className={`${isIOS ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-white'} font-medium px-4 py-2 rounded-lg w-full`}
                  >
                    {isIOS ? 'Enter Tag ID Manually' : 'Use Manual Entry Instead'}
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setManualMode(true)}
                className="mt-4 text-gray-600 hover:text-gray-800 text-sm underline"
              >
                Or enter tag ID manually
              </button>
            </div>
          ) : (
            // Manual entry mode
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Enter NFC Tag ID</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NFC Tag ID
                  </label>
                  <input
                    type="text"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    placeholder="Enter tag ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    disabled={scanning}
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={scanning || !tagId.trim()}
                    className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scanning ? 'Scanning...' : 'Scan Tag'}
                  </button>
                  {isNFCSupported && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualMode(false)
                        setTagId('')
                        setError('')
                      }}
                      className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Use NFC
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

