'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowRight, 
  Tag, 
  X,
  CreditCard,
  Lock,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { orderService } from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function CartPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCartStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  })

  const subtotal = getTotalPrice()
  const totalItems = getTotalItems()
  const shipping = subtotal > 0 ? 5.99 : 0
  const tax = subtotal * 0.08
  const discount = couponApplied ? subtotal * 0.1 : 0
  const total = subtotal + shipping + tax - discount

  const updateItemQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id)
      toast.info('Item removed from cart')
    } else {
      updateQuantity(id, newQuantity)
    }
  }

  const removeItemFromCart = (id: number, name: string) => {
    removeItem(id)
    toast.info(`Removed ${name} from cart`)
  }

  const clearAllItems = () => {
    clearCart()
    toast.info('Cart cleared')
  }

  const applyCoupon = () => {
    if (couponCode === 'SAVE10') {
      setCouponApplied(true)
      toast.success('Coupon applied! 10% off')
    } else {
      toast.error('Invalid coupon code')
    }
  }

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout')
      router.push('/login')
      return
    }
    setIsCheckoutOpen(true)
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setIsProcessing(true)
    try {
      // Create orders for each item
      for (const item of items) {
        const orderData = {
          user_id: user?.id || 1,
          product_id: item.id,
          quantity: item.quantity,
          shipping_address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA',
          },
        }
        await orderService.createOrder(orderData)
      }

      // Payment successful
      setOrderComplete(true)
      clearCart()
      
      setTimeout(() => {
        setIsCheckoutOpen(false)
        setOrderComplete(false)
        toast.success('Order placed successfully!')
        router.push('/orders')
      }, 2000)

    } catch (error) {
      toast.error('Failed to place order. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium">Your cart is empty</h3>
        <p className="text-sm text-muted-foreground">Start shopping to add items</p>
        <Link href="/products">
          <Button className="mt-4">Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping Cart</h1>
        <span className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </span>
        <Button variant="ghost" size="sm" onClick={clearAllItems} className="text-red-500 hover:text-red-600">
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="h-20 w-20 rounded-lg bg-muted/20 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground/20">
                          {item.brand?.[0] || 'S'}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{item.brand}</p>
                          <h4 className="font-medium">{item.name}</h4>
                          <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span>Size: {item.selectedSize || item.size}</span>
                            <span>Color: {item.selectedColor || item.color}</span>
                            <span>Stock: {item.stock}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeItemFromCart(item.id, item.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs text-muted-foreground ml-2">
                            Stock: {item.stock}
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Order Summary</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {shipping > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount (SAVE10)</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={couponApplied}
                />
                <Button
                  variant="outline"
                  onClick={applyCoupon}
                  disabled={couponApplied || !couponCode}
                  className="gap-1"
                >
                  <Tag className="h-4 w-4" />
                  Apply
                </Button>
              </div>
              {couponApplied && (
                <p className="text-sm text-green-500">✅ Coupon applied!</p>
              )}

              <Button 
                className="w-full gap-2" 
                size="lg" 
                disabled={items.length === 0}
                onClick={handleCheckout}
              >
                <Lock className="h-4 w-4" />
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {!orderComplete ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Checkout</DialogTitle>
                <DialogDescription>
                  Complete your order to proceed with payment
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Order Summary */}
                <div className="rounded-lg bg-muted/20 p-4 space-y-2">
                  <p className="font-medium">Order Summary</p>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2">
                    <div className="flex items-center space-x-2 rounded-lg border p-3">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                        <CreditCard className="h-4 w-4" />
                        Credit / Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-3">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex items-center gap-2 cursor-pointer">
                        <span className="font-semibold text-blue-600">PayPal</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Card Details (shown when card selected) */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Card Number</Label>
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label>CVC</Label>
                        <Input
                          placeholder="123"
                          value={cardDetails.cvc}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Cardholder Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* PayPal placeholder */}
                {paymentMethod === 'paypal' && (
                  <div className="rounded-lg border p-4 text-center text-muted-foreground">
                    <p>You will be redirected to PayPal to complete your payment.</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Order Placed Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Your order has been confirmed. You will receive a confirmation email shortly.
              </p>
              <Button className="mt-4" onClick={() => router.push('/orders')}>
                View Orders
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}