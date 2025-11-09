'use client'

import Link from 'next/link'
import { useLoading } from '@/hooks/useLoading'
import { ReactNode, MouseEvent } from 'react'

interface LoadingLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  [key: string]: any // Allow other Link props
}

/**
 * Custom Link component that shows loading indicator immediately on click
 * Use this instead of Next.js Link for better loading feedback
 */
export default function LoadingLink({ href, children, onClick, ...props }: LoadingLinkProps) {
  const { setLoading, setLoadingMessage } = useLoading()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Show loading immediately
    setLoading(true)
    setLoadingMessage('Loading page...')
    
    // Call original onClick if provided
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

