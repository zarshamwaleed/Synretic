'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

const queryClient = new QueryClient()

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
          <div 
            className={cn(
              "flex flex-1 flex-col transition-all duration-300",
              sidebarOpen ? "lg:ml-[280px]" : "lg:ml-[72px]"
            )}
          >
            <Navbar 
              onMenuClick={() => setSidebarOpen(true)} 
              onToggleSidebar={toggleSidebar}
              sidebarOpen={sidebarOpen}
            />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" theme="dark" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}