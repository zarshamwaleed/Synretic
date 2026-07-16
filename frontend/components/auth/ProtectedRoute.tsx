'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('owner' | 'customer')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!isLoading && isAuthenticated && allowedRoles) {
      if (!allowedRoles.includes(user?.role as 'owner' | 'customer')) {
        // Redirect based on role
        if (user?.role === 'owner') {
          router.push('/dashboard')
        } else {
          router.push('/products')
        }
      }
    }
  }, [isAuthenticated, isLoading, router, user, allowedRoles])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}