'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '@/services/api'

type UserRole = 'customer' | 'owner' | 'admin' | 'guest'

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  preferences?: any
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (name: string, email: string, password: string) => Promise<User>
  logout: () => void
  isAuthenticated: boolean
  isOwner: boolean
  isCustomer: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('synretic_user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('📦 Loaded user from localStorage:', parsedUser)
        setUser(parsedUser)
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
        localStorage.removeItem('synretic_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authService.login({ email, password })
      console.log('📦 Login response:', response)
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: (response.user.role?.toLowerCase() as UserRole) || 'customer',
          preferences: response.user.preferences || {}
        }
        
        console.log('👤 Setting user data:', userData)
        console.log('👤 User role:', userData.role)
        
        setUser(userData)
        localStorage.setItem('synretic_user', JSON.stringify(userData))
        return userData
      }
      throw new Error('Login failed')
    } catch (error: any) {
      console.error('❌ Login error:', error)
      // If 401, clear any invalid session
      if (error.response?.status === 401) {
        localStorage.removeItem('synretic_user')
        setUser(null)
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true)
    try {
      const response = await authService.signup({ name, email, password })
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: (response.user.role?.toLowerCase() as UserRole) || 'customer',
          preferences: response.user.preferences || {}
        }
        setUser(userData)
        localStorage.setItem('synretic_user', JSON.stringify(userData))
        return userData
      }
      throw new Error('Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('synretic_user')
  }

  const isAuthenticated = !!user
  const isOwner = user?.role === 'owner' || user?.role === 'admin'
  const isCustomer = user?.role === 'customer'

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      signup,
      logout,
      isAuthenticated,
      isOwner,
      isCustomer
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}