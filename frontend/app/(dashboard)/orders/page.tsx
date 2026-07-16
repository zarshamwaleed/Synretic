'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Eye, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Loader2,
  ShoppingBag,
  MapPin,
  CreditCard,
  X
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { orderService, productService } from '@/services/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { toast } from 'sonner'

const statusConfig: Record<string, { variant: any, icon: any, label: string, color: string }> = {
  pending: { variant: 'warning', icon: Clock, label: 'Pending', color: 'text-yellow-500' },
  paid: { variant: 'info', icon: Package, label: 'Paid', color: 'text-blue-500' },
  shipped: { variant: 'default', icon: Truck, label: 'Shipped', color: 'text-primary' },
  delivered: { variant: 'success', icon: CheckCircle, label: 'Delivered', color: 'text-green-500' },
  refunded: { variant: 'destructive', icon: XCircle, label: 'Refunded', color: 'text-red-500' },
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [productDetails, setProductDetails] = useState<Record<number, any>>({})
  const [productErrors, setProductErrors] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => orderService.getOrders(user?.id || 1),
    enabled: !!user?.id && isAuthenticated,
  })

  // Fetch product details for each order with better error handling
  // Fetch product details for each order with better error handling
useEffect(() => {
  const fetchProductDetails = async () => {
    if (!orders || orders.length === 0) return

    const productIds = [...new Set(orders.map((order: any) => order.product_id))] as number[]
    const details: Record<number, any> = {}
    const errors: Set<number> = new Set()

    await Promise.all(
      productIds.map(async (id) => {
        try {
          const product = await productService.getProduct(id)
          if (product) {
            details[id] = product
          } else {
            errors.add(id)
          }
        } catch (error) {
          errors.add(id)
        }
      })
    )

    setProductDetails(details)
    setProductErrors(errors)
  }

  fetchProductDetails()
}, [orders])

  const filteredOrders = orders?.filter((order: any) => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        order.order_id.toString().includes(q) ||
        order.status.includes(q)
      )
    }
    return true
  })

  const openOrderDetails = (order: any) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  if (!isAuthenticated && !user) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'owner']}>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['customer', 'owner']}>
        <div className="flex h-[400px] flex-col items-center justify-center">
          <p className="text-muted-foreground">Error loading orders</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
          <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['customer', 'owner']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-sm text-muted-foreground">
              {orders?.length || 0} total orders
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-9 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'paid', 'shipped', 'delivered', 'refunded'].map((status) => (
            <Badge
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              className="cursor-pointer capitalize"
              onClick={() => setFilterStatus(status)}
            >
              {status === 'all' ? 'All' : status}
            </Badge>
          ))}
        </div>

        {/* Orders list */}
        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order: any) => {
              const statusInfo = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = statusInfo.icon
              
              return (
                <Card key={order.order_id} className="transition-all hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <StatusIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Order #{order.order_id}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.order_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                        {order.tracking_number && (
                          <span className="text-xs text-muted-foreground">
                            Tracking: {order.tracking_number}
                          </span>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => openOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No orders found</h3>
            <p className="text-sm text-muted-foreground">
              {orders?.length === 0 
                ? "You haven't placed any orders yet" 
                : "No orders match your filters"}
            </p>
            {orders?.length === 0 && (
              <Button className="mt-4" variant="gradient" onClick={() => router.push('/products')}>
                Start Shopping
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl">
                    Order #{selectedOrder.order_id}
                  </DialogTitle>
                  <Badge variant={statusConfig[selectedOrder.status]?.variant || 'secondary'}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <DialogDescription>
                  Placed on {formatDate(selectedOrder.order_date)}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Order Status Timeline */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Order Status</h4>
                    <div className="relative">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-4 w-4 rounded-full bg-green-500" />
                          <div className="h-full w-0.5 bg-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-green-500">Order Confirmed</p>
                          <p className="text-xs text-muted-foreground">{formatDate(selectedOrder.order_date)}</p>
                        </div>
                      </div>
                      {selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? (
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex flex-col items-center">
                            <div className="h-4 w-4 rounded-full bg-primary" />
                            <div className="h-full w-0.5 bg-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">Shipped</p>
                            <p className="text-xs text-muted-foreground">On its way</p>
                          </div>
                        </div>
                      ) : null}
                      {selectedOrder.status === 'delivered' ? (
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex flex-col items-center">
                            <div className="h-4 w-4 rounded-full bg-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-green-500">Delivered</p>
                            <p className="text-xs text-muted-foreground">Order completed</p>
                          </div>
                        </div>
                      ) : null}
                      {selectedOrder.status === 'refunded' ? (
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex flex-col items-center">
                            <div className="h-4 w-4 rounded-full bg-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-red-500">Refunded</p>
                            <p className="text-xs text-muted-foreground">Order refunded</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Separator />

                  {/* Order Details */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Order Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order ID</span>
                        <span className="font-medium">#{selectedOrder.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={statusConfig[selectedOrder.status]?.variant || 'secondary'}>
                          {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Status</span>
                        <Badge variant={selectedOrder.payment_status === 'completed' ? 'success' : 'warning'}>
                          {selectedOrder.payment_status || 'pending'}
                        </Badge>
                      </div>
                      {selectedOrder.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tracking Number</span>
                          <span className="font-medium">{selectedOrder.tracking_number}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Shipping Address */}
                  {selectedOrder.shipping_address && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </h4>
                        <div className="rounded-lg bg-muted/20 p-3 text-sm">
                          <p>{selectedOrder.shipping_address.street}</p>
                          <p>
                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                          </p>
                          <p>{selectedOrder.shipping_address.country}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Order Items - Updated to show product details with fallback */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">Items</h4>
                    <div className="rounded-lg bg-muted/20 p-3 space-y-3">
                      {(() => {
                        const product = productDetails[selectedOrder.product_id]
                        const hasError = productErrors.has(selectedOrder.product_id)
                        
                        // If product not found or error, show generic info
                        if (!product || hasError) {
                          return (
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-sm">
                                      Product #{selectedOrder.product_id}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Product details not available
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-sm">
                                      {formatCurrency(selectedOrder.total_amount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {selectedOrder.quantity}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        // Product found - show full details
                        return (
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted/30 overflow-hidden flex-shrink-0">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name || 'Product'}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground/30">
                                  {product.brand?.[0] || 'P'}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {product.name || `Product #${selectedOrder.product_id}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {product.brand || 'Unknown Brand'} • {product.category || 'N/A'}
                                  </p>
                                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span>Size: {product.size || 'N/A'}</span>
                                    <span>Color: {product.color || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-sm">
                                    {formatCurrency(selectedOrder.total_amount)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qty: {selectedOrder.quantity}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Summary */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>$0.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatCurrency(selectedOrder.total_amount * 0.08)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(selectedOrder.total_amount * 1.08)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="flex justify-end mt-4 pt-4 border-t">
                <Button variant="ghost" size="sm" onClick={() => setIsDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}