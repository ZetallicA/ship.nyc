'use client'

import { useState, useEffect, useRef } from 'react'
import apiClient from '@/lib/axios'

interface NFCScannerProps {
  onScanSuccess: (scanData: {
    tag_id: string
    location_name?: string
    expires_at?: string
  }) => void
  onError?: (error: string) => void
  disabled?: boolean
  adminMode?: boolean // If true, just read tag ID without API call
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

export default function NFCScanner({ onScanSuccess, onError, disabled = false, adminMode = false }: NFCScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [tagId, setTagId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scanData, setScanData] = useState<NFCScanResponse | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [scannedTagId, setScannedTagId] = useState<string | null>(null) // Store scanned tag ID for display
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const readerRef = useRef<any>(null) // Store NDEFReader reference for cleanup
  const readingHandlerRef = useRef<((event: any) => Promise<void>) | null>(null)
  const errorHandlerRef = useRef<((event: any) => void) | null>(null)

  // Check if Web NFC is available
  // Web NFC API is supported in Chrome on Android (Android 5.0+)
  // NOT supported in iOS Safari - iOS has NFC but not Web NFC API
  // Requires HTTPS (secure context)
  // Based on: https://googlechrome.github.io/samples/web-nfc/
  const isSecureContext = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
  const hasNDEFReader = typeof window !== 'undefined' && 'NDEFReader' in window
  const isNFCSupported = isSecureContext && hasNDEFReader
  
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

  // Cleanup function to stop NFC reader
  const stopNFCReader = () => {
    if (readerRef.current) {
      try {
        // Remove event listeners if they exist
        if (readingHandlerRef.current) {
          readerRef.current.removeEventListener('reading', readingHandlerRef.current)
          readingHandlerRef.current = null
        }
        if (errorHandlerRef.current) {
          readerRef.current.removeEventListener('readingerror', errorHandlerRef.current)
          errorHandlerRef.current = null
        }
        // Clear the reader reference
        readerRef.current = null
      } catch (err) {
        console.error('Error stopping NFC reader:', err)
      }
    }
  }

  // Normalize tag ID - handle different formats (hex, decimal, etc.)
  const normalizeTagId = (tagId: string): string => {
    // Remove whitespace and convert to uppercase (for hex strings)
    let normalized = tagId.trim().toUpperCase()
    
    // If it looks like a hex string without prefix, keep it as is
    // If it has colons or spaces (common in NFC serial numbers), remove them
    normalized = normalized.replace(/[:-\s]/g, '')
    
    // If it's a hex string that might have been read as decimal, try to format it
    // But for now, just return the cleaned version
    return normalized
  }

  // Extract tag ID from NDEF message - handles multiple record types
  // Based on Web NFC API: https://googlechrome.github.io/samples/web-nfc/
  const extractTagId = (event: any): string | null => {
    try {
      console.log('NFC reading event:', event)
      console.log('Serial Number:', event.serialNumber)
      console.log('Serial Number type:', typeof event.serialNumber)
      console.log('Message:', event.message)
      
      let tagId: string | null = null
      
      // First, try to use serial number (most reliable for tag identification)
      if (event.serialNumber) {
        // Serial number can be a string or might need conversion
        if (typeof event.serialNumber === 'string') {
          tagId = event.serialNumber
        } else if (typeof event.serialNumber === 'number') {
          // Convert number to string (might be decimal representation)
          tagId = event.serialNumber.toString()
        } else {
          // Try to convert to string
          tagId = String(event.serialNumber)
        }
        console.log('Using serial number as tag ID:', tagId)
      }

      // If no serial number or it's empty, try to extract from NDEF records
      if (!tagId && event.message && event.message.records && event.message.records.length > 0) {
        const record = event.message.records[0]
        console.log('First record:', record)
        console.log('Record type:', record.recordType)
        
        // Handle different record types
        if (record.recordType === 'text') {
          // Text record - decode the data
          const decoder = new TextDecoder(record.encoding || 'utf-8')
          const text = decoder.decode(record.data)
          console.log('Decoded text:', text)
          tagId = text
        } else if (record.recordType === 'url') {
          // URL record - decode the data
          const decoder = new TextDecoder()
          const url = decoder.decode(record.data)
          console.log('Decoded URL:', url)
          tagId = url
        } else if (record.recordType === 'empty') {
          // Empty record - no data
          console.warn('Empty NDEF record')
        } else {
          // Other record types - try to decode as text
          try {
            const decoder = new TextDecoder()
            const data = decoder.decode(record.data)
            console.log('Decoded data:', data)
            tagId = data
          } catch (decodeErr) {
            console.error('Failed to decode record data:', decodeErr)
          }
        }
      }
      
      if (tagId) {
        // Normalize the tag ID before returning
        const normalized = normalizeTagId(tagId)
        console.log('Normalized tag ID:', normalized, '(original:', tagId, ')')
        return normalized
      }
      
      console.warn('No serial number or NDEF records found')
      return null
    } catch (err) {
      console.error('Error extracting tag ID:', err)
      return null
    }
  }

  const scanWithWebNFC = async () => {
    if (!isNFCSupported) {
      setError('NFC is not supported on this device. Please use manual entry.')
      setManualMode(true)
      return
    }

    // Clean up any existing reader
    stopNFCReader()

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      // Use Web NFC API - https://googlechrome.github.io/samples/web-nfc/
      // Access NDEFReader from window
      // @ts-ignore - Web NFC API
      const NDEFReaderClass = (window as any).NDEFReader
      if (!NDEFReaderClass) {
        throw new Error('NDEFReader is not available. Make sure you are using Chrome on Android with HTTPS.')
      }
      
      const reader = new NDEFReaderClass()
      readerRef.current = reader
      
      console.log('NDEFReader created, setting up event listeners...')
      
      // Define event handlers and store references for cleanup
      // Based on Web NFC API pattern: https://googlechrome.github.io/samples/web-nfc/
      const handleReading = async (event: any) => {
        try {
          console.log('NFC tag detected!', event)
          console.log('Serial Number:', event.serialNumber)
          console.log('Message:', event.message)
          
          // Extract tag ID (prefer serial number, fallback to NDEF record data)
          const tagIdString = extractTagId(event)
          
          if (tagIdString) {
            console.log('Extracted tag ID:', tagIdString)
            
            // Stop scanning after successful read
            stopNFCReader()
            setScanning(false)
            
            // Submit the scan (will handle admin mode vs driver mode)
            await handleScanSubmit(tagIdString)
          } else {
            console.error('Could not extract tag ID from NFC tag')
            setError('Could not read tag ID from NFC tag. The tag may be empty or unformatted. Try another tag or use manual entry.')
            setScanning(false)
            stopNFCReader()
          }
        } catch (err: any) {
          console.error('Error in handleReading:', err)
          setError(err.message || 'Failed to read NFC tag')
          setScanning(false)
          stopNFCReader()
        }
      }

      const handleReadingError = (event: any) => {
        console.error('NFC reading error:', event)
        setError('Cannot read data from the NFC tag. Try another tag or use manual entry.')
        setScanning(false)
        stopNFCReader()
      }

      // Store handler references for cleanup
      readingHandlerRef.current = handleReading
      errorHandlerRef.current = handleReadingError

      // Add event listeners BEFORE calling scan()
      // Based on Web NFC API pattern: https://googlechrome.github.io/samples/web-nfc/
      reader.addEventListener('reading', handleReading)
      reader.addEventListener('readingerror', handleReadingError)
      
      // Start scanning - this will trigger 'reading' event when tag is detected
      await reader.scan()
      console.log('NFC scan started successfully - hold device near tag')

    } catch (err: any) {
      stopNFCReader()
      
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopNFCReader()
    }
  }, [])

  const handleScanSubmit = async (tagIdValue: string) => {
    if (!tagIdValue.trim()) {
      setError('Please enter or scan an NFC tag ID')
      return
    }

    setScanning(true)
    setError('')
    setSuccess('')

    try {
      // Admin mode: just return the tag ID without API call
      if (adminMode) {
        setSuccess('NFC tag ID read successfully!')
        setScanning(false)
        setManualMode(false)
        setTagId('')
        setError('')
        
        // Notify parent component with just the tag ID
        onScanSuccess({
          tag_id: tagIdValue.trim()
        })
        return
      }

      // Driver mode: call API to record scan
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

      console.log('Submitting NFC scan:', { tag_id: tagIdValue.trim(), coordinates })
      
      const response = await apiClient.post<NFCScanResponse>('/nfc/scan', {
        tag_id: tagIdValue.trim(),
        coordinates
      })

      console.log('NFC scan response:', response.data)

      setScanData(response.data)
      setSuccess(`Successfully scanned NFC tag at ${response.data.location_name}!`)
      setScanning(false) // Ensure scanning state is reset
      setManualMode(false)
      setTagId('')
      setError('') // Clear any previous errors
      setScannedTagId(null) // Clear scanned tag ID on success

      // Notify parent component
      onScanSuccess({
        tag_id: response.data.tag_id,
        location_name: response.data.location_name,
        expires_at: response.data.expires_at
      })

    } catch (err: any) {
      console.error('NFC scan API error:', err)
      console.error('Error response:', err.response)
      console.error('Error data:', err.response?.data)
      
      // Extract error message from various possible locations
      let errorMessage = 'Failed to scan NFC tag'
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      } else if (err.response?.status === 404) {
        // Store the scanned tag ID for prominent display
        setScannedTagId(tagIdValue.trim())
        // In admin mode, 404 is OK - it means the tag is not registered yet, which is expected
        if (adminMode) {
          setSuccess('NFC tag ID read successfully!')
          setScanning(false)
          setManualMode(false)
          setTagId('')
          setError('')
          
          // Notify parent component with just the tag ID
          onScanSuccess({
            tag_id: tagIdValue.trim()
          })
          return
        }
        errorMessage = `NFC tag not found. The tag ID "${tagIdValue.trim()}" is not registered in the system. Please register this tag in the Admin Panel first.`
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to scan NFC tags. Only drivers can scan tags.'
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid NFC tag. The tag may be inactive or incorrectly formatted.'
      }
      
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
            <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-5">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold mb-2">{error}</p>
                  
                  {scannedTagId && (
                    <div className="mt-4 bg-white border-2 border-red-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">📋 Scanned Tag ID:</p>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 bg-gray-100 px-4 py-3 rounded-lg font-mono text-lg text-gray-900 break-all">
                          {scannedTagId}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(scannedTagId)
                            setSuccess('Tag ID copied to clipboard!')
                            setTimeout(() => setSuccess(''), 3000)
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-blue-900 mb-2">✅ To register this tag:</p>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Go to <strong>Admin Panel → NFC Tags</strong></li>
                          <li>Click <strong>"Create New Tag"</strong></li>
                          <li>Paste the Tag ID above</li>
                          <li>Fill in the location details (Office, Location Name)</li>
                          <li>Click <strong>"Create Tag"</strong></li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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

