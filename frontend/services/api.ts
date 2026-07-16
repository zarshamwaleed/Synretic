import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============ API Client ============
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 404s are expected/handled in several places (e.g. product lookups for
    // orders whose products were deleted) — don't spam the console for those.
    if (error.response?.status !== 404) {
      console.error('API Error:', error)
    }
    return Promise.reject(error)
  }
)

// ============ Auth Service ============
export const authService = {
  signup: async (data: { name: string; email: string; password: string }) => {
    const response = await api.post('/api/user/signup', data)
    return response.data
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/api/user/login', data)
    return response.data
  },
}

// ============ Chat Service ============
export const chatService = {
  sendMessage: async (query: string, userId: number = 1, threadId?: string) => {
    const response = await api.post('/api/chat/', { 
      query, 
      user_id: userId, 
      thread_id: threadId 
    })
    return response.data
  },
}

// ============ Product Service ============
export const productService = {
  getProducts: async (params?: any) => {
    const response = await api.get('/api/products/', { params })
    return response.data
  },
  getProduct: async (id: number) => {
    const response = await api.get(`/api/products/${id}`)
    return response.data
  },
  // Create product with image upload
  createProduct: async (formData: FormData) => {
    const response = await api.post('/api/products/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  // Update product with image upload
  updateProduct: async (id: number, formData: FormData) => {
    const response = await api.put(`/api/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  deleteProduct: async (id: number) => {
    const response = await api.delete(`/api/products/${id}`)
    return response.data
  },
}


// ============ Order Service ============
export const orderService = {
  createOrder: async (data: {
    user_id: number
    product_id: number
    quantity: number
    shipping_address: any
  }) => {
    const response = await api.post('/api/orders/', data)
    return response.data
  },
  getOrders: async (userId: number) => {
    try {
      const response = await api.get('/api/orders/', { params: { user_id: userId } })
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch orders:', error)
      return []
    }
  },
  // NEW: Get all orders (for owner)
  getAllOrders: async () => {
    try {
      const response = await api.get('/api/orders/all')
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch all orders:', error)
      return []
    }
  },
  getOrder: async (id: number) => {
    const response = await api.get(`/api/orders/${id}`)
    return response.data
  },
}

// ============ User Service ============
export const userService = {
  getUser: async (id: number) => {
    const response = await api.get(`/api/user/${id}`)
    return response.data
  },
  getUsers: async () => {
    try {
      const response = await api.get('/api/user/')
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch users:', error)
      return []
    }
  },
  updatePreferences: async (id: number, preferences: any) => {
    const response = await api.put(`/api/user/${id}`, preferences)
    return response.data
  },
  updateProfile: async (id: number, data: { name: string }) => {
    const response = await api.put(`/api/user/${id}`, { name: data.name })
    return response.data
  },
}

