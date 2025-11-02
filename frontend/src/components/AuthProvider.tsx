'use client'

import { AuthProvider } from '@/hooks/useAuth'

export default function Provider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

