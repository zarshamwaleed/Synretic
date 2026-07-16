'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Package,
  ShoppingCart,
  User,
  Settings,
  LogOut,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout, isOwner } = useAuth()

  // Navigation based on role
  const allNavigation = [
    { name: 'Home', href: '/', icon: Home, show: true },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: isOwner },
    { name: 'AI Assistant', href: '/chat', icon: MessageSquare, show: true },
    { name: 'Products', href: '/products', icon: Package, show: !isOwner },
    { name: 'Orders', href: '/orders', icon: ShoppingBag, show: !isOwner },
    { name: 'Cart', href: '/cart', icon: ShoppingCart, show: !isOwner },
    { name: 'Profile', href: '/profile', icon: User, show: true },
  ]

  const navigation = allNavigation.filter(item => item.show !== false)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }} // Keep on screen but transition width
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r bg-[#0a0a0a] border-zinc-900 text-zinc-400 transition-all duration-300 flex flex-col',
          isOpen ? 'w-[280px]' : 'w-[72px]'
        )}
      >
        {/* Header - Centered Logo when collapsed */}
        <div className={cn(
          "flex h-16 items-center border-b border-zinc-900 px-4 shrink-0 relative",
          isOpen ? "justify-between" : "justify-center"
        )}>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-purple-900/20">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            
            {isOpen && (
              <span className="text-sm font-semibold tracking-tight text-white transition-opacity duration-200">
                Synretic
              </span>
            )}
          </div>

          {isOpen && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Badge 
                variant="secondary" 
                className="text-[10px] bg-zinc-800 text-zinc-200 border-none px-1.5 py-0"
              >
                AI
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 shrink-0"
                onClick={onToggle}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Centered border-line toggle button when collapsed */}
          {!isOpen && onToggle && (
            <button 
              onClick={onToggle} 
              className="absolute right-0 translate-x-1/2 top-20 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-white z-50 transition-colors shadow-lg shadow-black/50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Centered Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-3 flex flex-col items-stretch [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isOpen ? item.name : undefined} // Clean native browser tooltip when collapsed
                className={cn(
                  'group flex items-center rounded-lg py-2.5 transition-all duration-200 relative shrink-0',
                  isOpen ? 'px-4 gap-3' : 'justify-center px-0 w-12 h-12 mx-auto',
                  isActive
                    ? 'bg-zinc-900/80 text-white font-medium'
                    : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 shrink-0 transition-transform group-hover:scale-105',
                  isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                )} />
                
                {isOpen && (
                  <span className="text-sm tracking-wide">
                    {item.name}
                  </span>
                )}

                {isActive && isOpen && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-zinc-900 p-3 space-y-2 shrink-0">
          {isOpen && user && (
            <div className="rounded-lg bg-zinc-950 border border-zinc-900/80 p-3 text-xs space-y-1 overflow-hidden">
              <p className="text-zinc-500 truncate">
                User: <span className="font-medium text-zinc-300">{user.name}</span>
              </p>
              <p className="text-zinc-500">
                Role: <span className="font-semibold text-zinc-400 capitalize">{user.role}</span>
              </p>
            </div>
          )}

          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-3 rounded-lg py-2.5 text-sm text-zinc-500 transition-all hover:bg-red-950/20 hover:text-red-400 shrink-0',
              isOpen ? 'w-full px-4' : 'justify-center w-12 h-12 mx-auto px-0'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>
    </>
  )
}