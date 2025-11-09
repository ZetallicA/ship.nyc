'use client'

import { useEffect } from 'react'

export default function HideDevIndicators() {
  useEffect(() => {
    // Function to hide all Next.js dev indicators - more aggressive approach
    const hideIndicators = () => {
      // First, try specific selectors
      const selectors = [
        '[data-nextjs-static-indicator]',
        '[data-nextjs-route-indicator]',
        '[data-nextjs-route-badge]',
        '[data-nextjs-static-badge]',
        '.__nextjs-dev-indicator',
        '.nextjs-dev-indicator',
        '#__next-build-watcher',
        '[data-nextjs-build-watcher]',
        '[id*="nextjs"]',
        '[class*="nextjs"]',
        '[class*="__next"]',
        '[id*="__next"]',
      ]

      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector)
          elements.forEach(el => {
            if (el instanceof HTMLElement) {
              const style = window.getComputedStyle(el)
              // Check if it's in bottom-left or bottom-right corner
              const isBottomCorner = (
                style.position === 'fixed' &&
                (style.bottom === '0px' || style.bottom === '0' || parseFloat(style.bottom) < 50) &&
                (style.left === '0px' || style.left === '0' || parseFloat(style.left) < 50 ||
                 style.right === '0px' || style.right === '0' || parseFloat(style.right) < 50)
              )
              
              if (isBottomCorner || selector.includes('nextjs') || selector.includes('__next')) {
                el.style.display = 'none'
                el.style.visibility = 'hidden'
                el.style.opacity = '0'
                el.style.pointerEvents = 'none'
                el.style.zIndex = '-9999'
                el.style.height = '0'
                el.style.width = '0'
                el.style.overflow = 'hidden'
              }
            }
          })
        } catch (e) {
          // Ignore selector errors
        }
      })

      // Second, check ALL fixed position elements in bottom corners
      try {
        const allElements = document.querySelectorAll('*')
        allElements.forEach(el => {
          if (el instanceof HTMLElement) {
            const style = window.getComputedStyle(el)
            const rect = el.getBoundingClientRect()
            const text = el.textContent || ''
            
            // Check if element is in bottom-left corner and small
            const isBottomLeft = (
              style.position === 'fixed' &&
              rect.bottom < 100 && // Within 100px of bottom
              rect.left < 200 && // Within 200px of left
              (rect.width < 200 || rect.height < 100) && // Small element
              (text.includes('Static') || text.includes('Route') || text.includes('SSG') || 
               text.includes('SSR') || text.includes('dev') || text.includes('next') ||
               el.id?.includes('next') || el.className?.includes('next'))
            )
            
            if (isBottomLeft) {
              el.style.display = 'none'
              el.style.visibility = 'hidden'
              el.style.opacity = '0'
              el.style.pointerEvents = 'none'
              el.style.zIndex = '-9999'
              el.style.height = '0'
              el.style.width = '0'
              el.style.overflow = 'hidden'
            }
          }
        })
      } catch (e) {
        // Ignore errors
      }
    }

    // Run immediately
    hideIndicators()

    // Run multiple times with delays to catch late-loading indicators
    const timeouts = [
      setTimeout(hideIndicators, 50),
      setTimeout(hideIndicators, 100),
      setTimeout(hideIndicators, 250),
      setTimeout(hideIndicators, 500),
      setTimeout(hideIndicators, 1000),
    ]

    // Watch for dynamically added indicators with aggressive monitoring
    const observer = new MutationObserver(() => {
      hideIndicators()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'id', 'data-nextjs-static-indicator', 'data-nextjs-route-indicator']
    })

    // Also watch document for any new elements
    const docObserver = new MutationObserver(() => {
      hideIndicators()
    })

    if (document.documentElement) {
      docObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true
      })
    }

    // Cleanup
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
      observer.disconnect()
      docObserver.disconnect()
    }
  }, [])

  return null
}

