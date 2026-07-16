'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Zap,
  ArrowUpRight,
  Clock,
  Sparkles,
  Users,
  DollarSign,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  Image as ImageIcon,
  X,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { orderService, productService, userService } from '@/services/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'

export default function DashboardPage() {
  const { user, isAuthenticated, isOwner, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Product Management State
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    brand: '',
    size: '',
    color: '',
    image: null as File | null,
    imagePreview: '',
  })

  // Order Management State
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // ============ Fetch Data ============
  // Fetch ALL orders (owner sees all customer orders)
  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['dashboard-all-orders'],
    queryFn: () => orderService.getAllOrders(),
    enabled: isOwner && isClient,
  })

  // Fetch products
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['dashboard-products'],
    queryFn: () => productService.getProducts({ limit: 100 }),
    enabled: isOwner && isClient,
  })

  // Fetch users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: () => userService.getUsers(),
    enabled: isOwner && isClient,
  })

  // Redirect logic
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!isOwner) {
        router.push('/products')
      }
    }
  }, [isAuthenticated, isOwner, authLoading, router])

  // Product CRUD Operations
  const handleAddProduct = () => {
    setProductForm({
      name: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      brand: '',
      size: '',
      color: '',
      image: null,
      imagePreview: '',
    })
    setEditingProduct(null)
    setIsProductDialogOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      brand: product.brand,
      size: product.size,
      color: product.color,
      image: null,
      imagePreview: product.image || '',
    })
    setIsProductDialogOpen(true)
  }

  const handleDeleteProduct = async (productId: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId)
        toast.success('Product deleted successfully')
        refetchProducts()
      } catch (error) {
        toast.error('Failed to delete product')
      }
    }
  }

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProductForm({
        ...productForm,
        image: file,
        imagePreview: URL.createObjectURL(file)
      })
    }
  }

  const removeImage = () => {
    setProductForm({
      ...productForm,
      image: null,
      imagePreview: '',
    })
  }

  const handleSaveProduct = async () => {
    try {
      const formData = new FormData()
      formData.append('name', productForm.name)
      formData.append('description', productForm.description)
      formData.append('category', productForm.category)
      formData.append('price', productForm.price)
      formData.append('stock', productForm.stock)
      formData.append('brand', productForm.brand)
      formData.append('size', productForm.size)
      formData.append('color', productForm.color)
      if (productForm.image) {
        formData.append('image', productForm.image)
      }

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, formData)
        toast.success('Product updated successfully')
      } else {
        await productService.createProduct(formData)
        toast.success('Product created successfully')
      }
      setIsProductDialogOpen(false)
      refetchProducts()
    } catch (error) {
      toast.error('Failed to save product')
    }
  }

  // Filter products
  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate stats
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total_amount, 0)
  const totalOrders = orders.length
  const totalProducts = products.length
  const totalUsers = users.length
  const activeAgents = 4

  // All orders (for owner)
  const allOrders = orders
    .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())

  if (!isClient || authLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || !isOwner) {
    return null
  }

  const isLoading = ordersLoading || productsLoading || usersLoading

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-white" />
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.name || 'Admin'}! 👋
            </h1>
          </div>
          <p className="mt-2 text-blue-100">
            Your AI agents are working hard. Here's what's happening today.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Zap className="mr-1 h-3 w-3" />
              {activeAgents} Active Agents
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Clock className="mr-1 h-3 w-3" />
              {totalOrders} Total Orders
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
              <Users className="mr-1 h-3 w-3" />
              {totalUsers} Customers
            </Badge>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Revenue',
            value: formatCurrency(totalRevenue),
            change: '+12.5%',
            trend: 'up',
            icon: DollarSign,
            description: 'vs last month',
          },
          {
            title: 'Orders',
            value: totalOrders.toString(),
            change: '+8.2%',
            trend: 'up',
            icon: ShoppingBag,
            description: 'vs last month',
          },
          {
            title: 'Products',
            value: totalProducts.toString(),
            change: '+3.1%',
            trend: 'up',
            icon: Package,
            description: 'in inventory',
          },
          {
            title: 'AI Agents',
            value: activeAgents.toString(),
            change: 'Active',
            trend: 'up',
            icon: Zap,
            description: 'All operational',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card/50 to-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-sm">
                  <span className={cn(
                    'flex items-center font-medium',
                    stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    <ArrowUpRight className="h-3 w-3" />
                    {stat.change}
                  </span>
                  <span className="text-muted-foreground">{stat.description}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs: Products, Orders, Customers */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Manage Products ({filteredProducts.length})</h2>
            <Button onClick={handleAddProduct} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell>
                          {product.image ? (
                            <div className="h-10 w-10 rounded-md overflow-hidden">
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-muted/20 flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.brand}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>
                          <Badge variant={product.stock < 10 ? 'destructive' : 'default'}>
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Orders ({allOrders.length})</h2>
            <Button variant="outline" size="sm" onClick={() => refetchOrders()} className="gap-1">
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders.length > 0 ? (
                    allOrders.map((order: any) => {
                      const product = products.find((p: any) => p.id === order.product_id)
                      return (
                        <TableRow key={order.order_id}>
                          <TableCell className="font-medium">#{order.order_id}</TableCell>
                          <TableCell>User #{order.user_id}</TableCell>
                          <TableCell>{product?.name || `Product #${order.product_id}`}</TableCell>
                          <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === 'delivered'
                                  ? 'success'
                                  : order.status === 'paid'
                                  ? 'info'
                                  : order.status === 'shipped'
                                  ? 'default'
                                  : order.status === 'refunded'
                                  ? 'destructive'
                                  : 'warning'
                              }
                            >
                              {order.status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.order_date)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsOrderDialogOpen(true)
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No orders placed yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Customers ({users.length})</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchUsers()}
                className="gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.role === 'owner' 
                                ? 'default' 
                                : user.role === 'admin' 
                                ? 'default' 
                                : 'secondary'
                            }
                          >
                            {user.role || 'customer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(user.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                          <p>No customers found</p>
                          <p className="text-sm">Customers will appear here when they sign up</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Image Upload */}
            <div className="col-span-2 space-y-2">
              <Label>Product Image</Label>
              <div className="flex items-center gap-4">
                {productForm.imagePreview ? (
                  <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                    <Image
                      src={productForm.imagePreview}
                      alt="Product preview"
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload product image (JPG, PNG, WebP)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                placeholder="Enter brand"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Input
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="Enter category"
              />
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Input
                value={productForm.size}
                onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                placeholder="Enter size"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                value={productForm.color}
                onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                placeholder="Enter color"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct}>
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">User #{selectedOrder.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={
                    selectedOrder.status === 'delivered'
                      ? 'success'
                      : selectedOrder.status === 'paid'
                      ? 'info'
                      : selectedOrder.status === 'shipped'
                      ? 'default'
                      : selectedOrder.status === 'refunded'
                      ? 'destructive'
                      : 'warning'
                  }>
                    {selectedOrder.status || 'pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant={selectedOrder.payment_status === 'completed' ? 'success' : 'warning'}>
                    {selectedOrder.payment_status || 'pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedOrder.total_amount)}</p>
                </div>
              </div>
              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-sm text-muted-foreground">Shipping Address</p>
                  <p className="text-sm">
                    {selectedOrder.shipping_address.street}
                    <br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                    <br />
                    {selectedOrder.shipping_address.country}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}