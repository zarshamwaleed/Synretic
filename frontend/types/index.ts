export interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  stock: number
  brand: string
  size: string
  color: string
  image?: string
  images?: string[]
  rating?: number
  reviews?: number
}

export interface Order {
  order_id: number
  user_id: number
  product_id: number
  quantity: number
  total_amount: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'refunded'
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  order_date: string
  tracking_number: string | null
  shipping_address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
}

export interface User {
  id: number
  name: string
  email: string
  preferences: Record<string, any>
  purchase_history: any[]
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agent_used?: string
  products_found?: number
  error?: string
}

export interface ChatRequest {
  query: string
  user_id: number
  thread_id?: string
}

export interface ChatResponse {
  success: boolean
  response: string
  agent_used: string
  products_found: number
  error: string | null
  timestamp: string
}