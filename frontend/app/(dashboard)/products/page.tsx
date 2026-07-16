'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useCartStore } from '@/store/cartStore'
import { cn } from '@/lib/utils'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Search, Filter, Grid, List } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { productService } from '@/services/api'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { ProductCard } from '@/components/products/ProductCard'

// Group products by name (variations)
function groupProductsByName(products: Product[]): Map<string, Product[]> {
  const groups = new Map<string, Product[]>()
  
  products.forEach((product) => {
    const key = `${product.name}-${product.brand}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(product)
  })
  
  return groups
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts({ limit: 100 }),
  })

  const categories = ['All', 'Running Shoes', 'Basketball Shoes', 'Lifestyle Shoes', 'Casual Shoes', 'Skate Shoes']

  // Group products and filter
  const groupedProducts = useMemo(() => {
    if (!products) return new Map()
    
    const groups = groupProductsByName(products)
    const filtered = new Map<string, Product[]>()
    
    groups.forEach((variations, key) => {
      const firstProduct = variations[0]
      
      // Apply filters
      if (category !== 'All' && firstProduct.category !== category) return
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const match = firstProduct.name.toLowerCase().includes(q) ||
                     firstProduct.brand.toLowerCase().includes(q) ||
                     firstProduct.category.toLowerCase().includes(q)
        if (!match) return
      }
      
      filtered.set(key, variations)
    })
    
    return filtered
  }, [products, category, searchQuery])

  const totalProducts = useMemo(() => {
    let count = 0
    groupedProducts.forEach((variations) => {
      count += variations.length
    })
    return count
  }, [groupedProducts])
  
  const addToCart = useCartStore((state) => state.addItem)
  
  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, product.size, product.color)
    toast.success(`Added ${product.name} (${product.size}) to cart`)
  }
  
  const handleWishlist = (product: Product) => {
    toast.success(`Added ${product.name} to wishlist`)
  }

  const productsContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {totalProducts} products • {groupedProducts.size} unique styles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name, brand, or category..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/20 transition-colors"
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Product Grid */}
      <div className={cn(
        "grid gap-6",
        viewMode === 'grid' 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1"
      )}>
        {Array.from(groupedProducts.entries()).map(([key, variations], index) => {
          const mainProduct = variations[0]
          const otherVariations = variations.slice(1)
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard
                product={mainProduct}
                variations={otherVariations}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
              />
            </motion.div>
          )
        })}
      </div>

      {groupedProducts.size === 0 && (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </div>
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['customer']}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted/20 animate-pulse" />
          ))}
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['customer']}>
      {productsContent}
    </ProtectedRoute>
  )
}