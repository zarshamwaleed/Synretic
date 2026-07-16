'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Eye, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Product } from '@/types'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  variations?: Product[]
  onWishlist?: (product: Product) => void
}

export function ProductCard({ product, variations = [], onWishlist }: ProductCardProps) {
  const [selectedVariation, setSelectedVariation] = useState<Product>(product)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const addToCart = useCartStore((state) => state.addItem)

  const allVariations = [product, ...variations]
  const uniqueSizes = [...new Set(allVariations.map(p => p.size))]
  const uniqueColors = [...new Set(allVariations.map(p => p.color))]
  const totalStock = allVariations.reduce((sum, p) => sum + p.stock, 0)
  const hasVariations = variations.length > 0

  const handleAddToCart = () => {
    addToCart(selectedVariation, quantity, selectedVariation.size, selectedVariation.color)
    toast.success(`Added ${selectedVariation.name} (${selectedVariation.size}) to cart`)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-muted/20 to-muted/50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground/20">
              {product.brand?.[0] || 'S'}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {totalStock < 10 && totalStock > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              Low Stock
            </Badge>
          )}
          {totalStock === 0 && (
            <Badge variant="destructive" className="text-[10px]">
              Out of Stock
            </Badge>
          )}
          {hasVariations && (
            <Badge variant="default" className="text-[10px]">
              {variations.length + 1} Variants
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsWishlisted(!isWishlisted)
            onWishlist?.(product)
          }}
          className="absolute right-3 top-3 rounded-full bg-background/80 p-2 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm hover:bg-background"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isWishlisted ? "fill-red-500 text-red-500" : "hover:text-red-500"
            )}
          />
        </button>

        {/* Quick View Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 gap-2"
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <ProductDetails
              product={selectedVariation}
              variations={allVariations}
              onAddToCart={handleAddToCart}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{product.brand}</p>
            <h3 className="font-semibold line-clamp-1">{product.name}</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {product.category}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description}
        </p>

        {/* Available Sizes */}
        {uniqueSizes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">Sizes:</span>
            {uniqueSizes.slice(0, 4).map((size) => (
              <Badge
                key={size}
                variant="outline"
                className="text-[10px] cursor-pointer hover:bg-primary/10"
                onClick={() => {
                  const variation = allVariations.find(p => p.size === size)
                  if (variation) setSelectedVariation(variation)
                }}
              >
                {size}
              </Badge>
            ))}
            {uniqueSizes.length > 4 && (
              <Badge variant="outline" className="text-[10px]">
                +{uniqueSizes.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Available Colors */}
        {uniqueColors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">Colors:</span>
            {uniqueColors.slice(0, 4).map((color) => (
              <span
                key={color}
                className="h-4 w-4 rounded-full border cursor-pointer transition-all hover:scale-110"
                style={{ backgroundColor: color ? color.toLowerCase() : '#e5e5e5' }}
                onClick={() => {
                  const variation = allVariations.find(p => p.color === color)
                  if (variation) setSelectedVariation(variation)
                }}
              />
            ))}
            {uniqueColors.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{uniqueColors.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <span className="text-lg font-bold">${selectedVariation.price}</span>
            {hasVariations && (
              <span className="ml-2 text-xs text-muted-foreground">
                {variations.length + 1} variants
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleAddToCart()
            }}
            disabled={selectedVariation.stock === 0}
            className="gap-1"
          >
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Product Details Component (for the dialog)
function ProductDetails({
  product,
  variations,
  onAddToCart
}: {
  product: Product
  variations: Product[]
  onAddToCart: () => void
}) {
  const [selected, setSelected] = useState(product)
  const [quantity, setQuantity] = useState(1)

  const uniqueSizes = [...new Set(variations.map(p => p.size))]
  const uniqueColors = [...new Set(variations.map(p => p.color))]

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle className="text-xl">{selected.name}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square rounded-lg bg-muted/20 overflow-hidden">
          {selected.image ? (
            <Image
              src={selected.image}
              alt={selected.name}
              width={400}
              height={400}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl font-bold text-muted-foreground/20">
                {selected.brand?.[0] || 'S'}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{selected.brand}</p>
            <p className="text-2xl font-bold">${selected.price}</p>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
          </div>

          <div>
            <p className="text-sm font-medium">Category</p>
            <p className="text-sm text-muted-foreground">{selected.category}</p>
          </div>

          {/* Size Selection */}
          {uniqueSizes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const variation = variations.find(v => v.size === size)
                  const isAvailable = variation && variation.stock > 0
                  return (
                    <Button
                      key={size}
                      variant={selected.size === size ? 'default' : 'outline'}
                      size="sm"
                      disabled={!isAvailable}
                      onClick={() => {
                        const v = variations.find(v => v.size === size)
                        if (v) setSelected(v)
                      }}
                    >
                      {size} {!isAvailable && '(Out of Stock)'}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {uniqueColors.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Select Color</p>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      selected.color === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent"
                    )}
                    style={{ backgroundColor: color ? color.toLowerCase() : '#e5e5e5' }}
                    onClick={() => {
                      const v = variations.find(v => v.color === color)
                      if (v) setSelected(v)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <p className="text-sm font-medium mb-2">Quantity</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.min(selected.stock, quantity + 1))}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="text-xs text-muted-foreground ml-2">
                {selected.stock} available
              </span>
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full gap-2"
            size="lg"
            disabled={selected.stock === 0}
            onClick={onAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {selected.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </div>
  )
}