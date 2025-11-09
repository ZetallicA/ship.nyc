'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

interface PINPadProps {
  onPINComplete: (pin: string) => void
  onPINChange?: (pin: string) => void // Optional callback for every PIN change
  pinLength?: number
  disabled?: boolean
  error?: string
  resetTrigger?: number // Add a reset trigger that changes to reset the PIN
  enableKeyboard?: boolean // Control whether keyboard input is enabled (default: true)
  onFocus?: () => void // Callback when PIN pad is focused/clicked
}

export interface PINPadRef {
  focus: () => void
}

const PINPad = forwardRef<PINPadRef, PINPadProps>(({ onPINComplete, onPINChange, pinLength = 6, disabled = false, error, resetTrigger, enableKeyboard = true, onFocus }, ref) => {
  const [pin, setPin] = useState('')
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus the first button (number 1)
      if (firstButtonRef.current && !disabled) {
        firstButtonRef.current.focus()
      } else if (containerRef.current) {
        // Fallback: focus the container
        containerRef.current.focus()
      }
    }
  }))

  // Debug: render tracking
  console.log('PINPad: render, pin length =', pin.length, 'pin =', pin, 'enableKeyboard =', enableKeyboard)

  // Keyboard support: handle 0-9, Backspace, Escape, Enter
  // Only listen to keyboard events if enableKeyboard is true AND not disabled
  useEffect(() => {
    if (!enableKeyboard || disabled) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input field
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        // Only capture if the input is not focused (user clicked PIN pad)
        return
      }
      
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        handleNumberClick(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        handleBackspace()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleClear()
      } else if (e.key === 'Enter') {
        if (pin.length === pinLength) {
          onPINComplete(pin)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, pin, pinLength, onPINComplete, enableKeyboard])

  // Reset PIN when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      console.log('PINPad: resetTrigger changed ->', resetTrigger, 'clearing pin')
      setPin('')
      // Notify parent that PIN was cleared
      if (onPINChange) {
        onPINChange('')
      }
    }
  }, [resetTrigger]) // Removed onPINChange from dependencies to avoid infinite loops

  const handleNumberClick = (num: string) => {
    if (disabled) {
      console.log('PINPad: Button click ignored - disabled')
      return
    }
    // Use functional setState to check length and update atomically
    setPin((currentPin) => {
      // Check length using current state, not stale closure
      if (currentPin.length >= pinLength) {
        console.log('PINPad: Button click ignored - PIN already complete, current:', currentPin)
        return currentPin // Return unchanged if already complete
      }
      
      const newPin = currentPin + num
      console.log('PINPad: Adding digit', num, '| current PIN:', currentPin, '| new PIN:', newPin)
      
      // Notify parent after state update completes
      if (onPINChange) {
        // Use the newPin value directly, don't rely on state
        // Defer the callback to avoid React warning about updating parent during render
        // Use setTimeout with 0 delay for immediate execution after render
        setTimeout(() => {
          onPINChange(newPin)
        }, 0)
      }
      
      if (newPin.length === pinLength) {
        // Small delay to show the last digit before submitting
        setTimeout(() => {
          onPINComplete(newPin)
        }, 100)
      }
      
      return newPin
    })
  }

  const handleBackspace = () => {
    if (disabled || pin.length === 0) return
    setPin((currentPin) => {
      const newPin = currentPin.slice(0, -1)
      // Notify parent of PIN change after render
      if (onPINChange) {
        setTimeout(() => {
          onPINChange(newPin)
        }, 0)
      }
      return newPin
    })
  }

  const handleClear = () => {
    if (disabled) return
    setPin('')
    // Notify parent that PIN was cleared after render
    if (onPINChange) {
      setTimeout(() => {
        onPINChange('')
      }, 0)
    }
  }

  const renderDots = () => {
    return (
      <div className="flex justify-center gap-3 mb-6">
        {Array.from({ length: pinLength }).map((_, index) => (
          <div
            key={`dot-${index}`}
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

  const handlePadClick = () => {
    // When user clicks/touches the PIN pad, enable keyboard input
    if (onFocus) {
      onFocus()
    }
  }

  return (
    <div ref={containerRef} className="w-full max-w-sm mx-auto" onClick={handlePadClick} tabIndex={-1}>
      {renderDots()}
      
      {error && (
        <div className="mb-4 text-center text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num, index) => (
          <button
            key={num}
            ref={index === 0 ? firstButtonRef : null}
            onClick={() => handleNumberClick(num.toString())}
            disabled={disabled}
            className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-2xl font-semibold text-gray-900 hover:bg-gray-50 hover:border-primary-blue active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
          >
            {num}
          </button>
        ))}
        
        {/* Clear button */}
        <button
          onClick={handleClear}
          disabled={disabled || pin.length === 0}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-red-400 active:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
        >
          Clear
        </button>
        
        {/* Zero button */}
        <button
          onClick={() => handleNumberClick('0')}
          disabled={disabled}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-2xl font-semibold text-gray-900 hover:bg-gray-50 hover:border-primary-blue active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
        >
          0
        </button>
        
        {/* Backspace button */}
        <button
          onClick={handleBackspace}
          disabled={disabled || pin.length === 0}
          className="aspect-square bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-primary-blue active:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
          </svg>
        </button>
      </div>
    </div>
  )
})

PINPad.displayName = 'PINPad'

export default PINPad

