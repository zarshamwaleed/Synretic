import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types'

export interface CartItem extends Product {
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface CartStore {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  
  // Actions
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      addItem: (product: Product, quantity = 1, size?: string, color?: string) => {
        const items = get().items
        const existingItem = items.find(
          item => item.id === product.id && item.selectedSize === size && item.selectedColor === color
        )

        if (existingItem) {
          // Update quantity if item already exists
          const updatedItems = items.map(item =>
            item.id === product.id && item.selectedSize === size && item.selectedColor === color
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
          set({ items: updatedItems })
        } else {
          // Add new item
          const newItem: CartItem = {
            ...product,
            quantity,
            selectedSize: size || product.size,
            selectedColor: color || product.color
          }
          set({ items: [...items, newItem] })
        }
        
        // Recalculate totals
        set((state) => ({
          totalItems: state.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }))
      },

      removeItem: (productId: number) => {
        set((state) => ({
          items: state.items.filter(item => item.id !== productId)
        }))
        // Recalculate totals
        set((state) => ({
          totalItems: state.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }))
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map(item =>
            item.id === productId ? { ...item, quantity } : item
          )
        }))
        // Recalculate totals
        set((state) => ({
          totalItems: state.items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }))
      },

      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 })
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      }
    }),
    {
      name: 'cart-storage', // Unique name for localStorage
    }
  )
)