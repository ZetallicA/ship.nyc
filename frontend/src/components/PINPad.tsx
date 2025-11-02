'use client'

import { useState, useEffect } from 'react'

interface PINPadProps {
  onPINComplete: (pin: string) => void
  pinLength?: number
  disabled?: boolean
  error?: string
  resetTrigger?: number // Add a reset trigger that changes to reset the PIN
}

export default function PINPad({ onPINComplete, pinLength = 6, disabled = false, error, resetTrigger }: PINPadProps) {
  const [pin, setPin] = useState('')

  // Reset PIN when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setPin('')
    }
  }, [resetTrigger])

  const handleNumberClick = (num: string) => {
    if (disabled || pin.length >= pinLength) return
    const newPin = pin + num
    setPin(newPin)
    if (newPin.length === pinLength) {
      // Small delay to show the last digit before submitting
      setTimeout(() => {
        onPINComplete(newPin)
      }, 100)
    }
  }

  const handleBackspace = () => {
    if (disabled || pin.length === 0) return
    setPin(pin.slice(0, -1))
  }

  const handleClear = () => {
    if (disabled) return
    setPin('')
  }

  const renderDots = () => {
    return (
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: pinLength }).map((_, index) => (
          <div
            key={index}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              index < pin.length
                ? 'bg-primary-blue border-primary-blue'
                : 'border-gray-300 bg-transparent'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {renderDots()}
      
      {error && (
        <div className="mb-4 text-center text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-2xl font-semibold text-gray-900 hover:bg-gray-50 hover:border-primary-blue active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {num}
          </button>
        ))}
        
        {/* Clear button */}
        <button
          onClick={handleClear}
          disabled={disabled || pin.length === 0}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-red-400 active:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          Clear
        </button>
        
        {/* Zero button */}
        <button
          onClick={() => handleNumberClick('0')}
          disabled={disabled}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-2xl font-semibold text-gray-900 hover:bg-gray-50 hover:border-primary-blue active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          0
        </button>
        
        {/* Backspace button */}
        <button
          onClick={handleBackspace}
          disabled={disabled || pin.length === 0}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-primary-blue active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

