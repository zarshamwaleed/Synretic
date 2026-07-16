'use client'

import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'sonner'

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" theme="dark" richColors />
    </AuthProvider>
  )
}