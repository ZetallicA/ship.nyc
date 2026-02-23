import { useState } from 'react'

export default function HelpTooltip({ text, position = 'top', className = '' }: {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  const posMap = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }
  return (
    <div className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      <button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none rounded-full p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {visible && (
        <div className={`absolute z-50 w-64 p-3 text-sm text-white bg-gray-800 rounded-lg shadow-lg ${posMap[position]}`}>
          {text}
        </div>
      )}
    </div>
  )
}
