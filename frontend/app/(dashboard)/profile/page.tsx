'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Mail, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  TrendingUp, 
  Settings,
  Edit2,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { userService } from '@/services/api'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(authUser?.name || '')
  const [isSaving, setIsSaving] = useState(false)

  // If no user is logged in, redirect to login
  if (!authUser) {
    router.push('/login')
    return null
  }

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['user', authUser.id],
    queryFn: () => userService.getUser(authUser.id),
    enabled: !!authUser?.id,
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update user preferences
      await userService.updatePreferences(authUser.id, {
        name: name,
        ...user?.preferences
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
      refetch()
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
     

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
                {getInitials(user?.name || authUser?.name || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              {isEditing ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Label>Name</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="max-w-xs"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">{user?.name || authUser?.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user?.email || authUser?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(user?.created_at || new Date())}
                    </span>
                  </div>
                </>
              )}
            </div>
            <Badge variant="default" className="gap-1 capitalize">
              <User className="h-3 w-3" />
              {user?.role || authUser?.role || 'customer'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{user?.purchase_history?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <Heart className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wishlist</p>
                <p className="text-xl font-bold">0</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Recommendations</p>
                <p className="text-xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Settings className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preferences</p>
                <p className="text-xl font-bold">
                  {Object.keys(user?.preferences || {}).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user?.purchase_history && user.purchase_history.length > 0 ? (
              user.purchase_history.slice(0, 4).map((activity: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">
                    {activity.action || `Order #${activity.order_id || 'N/A'}`}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(activity.date || new Date())}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex h-[100px] items-center justify-center">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
            
            {/* Fallback activity if no purchase history */}
            {(!user?.purchase_history || user.purchase_history.length === 0) && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">Welcome to Synretic!</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Just now
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm">Start exploring products</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    Today
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}